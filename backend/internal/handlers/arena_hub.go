package handlers

import (
	"encoding/json"
	"math"
	"math/rand"
	"net/http"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all CORS in dev/prod with reverse proxy
	},
}

type ArenaMessage struct {
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload,omitempty"`
}

type JoinQueuePayload struct {
	PlayerName string `json:"playerName"`
	PlayerELO  int    `json:"playerElo"`
}

type ProgressPayload struct {
	ProgressPct int     `json:"progressPct"`
	CurrentWPM  int     `json:"currentWpm"`
	Accuracy    float64 `json:"accuracy"`
}

type FinishPayload struct {
	TimeTakenSec float64 `json:"timeTakenSec"`
	Accuracy     float64 `json:"accuracy"`
	WordsCorrect int     `json:"wordsCorrect"`
}

type DuelChallenge struct {
	Title       string   `json:"title"`
	Passage     string   `json:"passage"`
	Blanks      []string `json:"blanks"`
	DurationSec int      `json:"durationSec"`
}

var ArenaChallenges = []DuelChallenge{
	{
		Title:       "Academic Research & Marine Ecosystems (C-Test)",
		Passage:     "Marine biolog___ have discov___ that coral re___ are adapt___ to ris___ ocean temperat___ faster than previou___ estimated by laborat___ models.",
		Blanks:      []string{"ists", "ered", "efs", "ing", "ing", "ures", "sly", "ory"},
		DurationSec: 60,
	},
	{
		Title:       "Artificial Intelligence in Healthcare (C-Test)",
		Passage:     "Modern algori___ are capab___ of analyz___ complex biomedi___ data to predic___ patient diagnos___ with unprecede___ accuracy.",
		Blanks:      []string{"thms", "le", "ing", "cal", "t", "es", "nted"},
		DurationSec: 60,
	},
	{
		Title:       "Urban Transportation Architecture (C-Test)",
		Passage:     "Metropoli___ planners are prioriti___ sustainable elect___ transit netwo___ to mitig___ atmospheric emissi___ in peripheral distri___.",
		Blanks:      []string{"tan", "zing", "ric", "rks", "ate", "ons", "cts"},
		DurationSec: 60,
	},
}

type ArenaClient struct {
	ID         string
	Name       string
	ELO        int
	Conn       *websocket.Conn
	Room       *ArenaRoom
	Send       chan []byte
	IsFinished bool
	Result     *FinishPayload
}

type ArenaRoom struct {
	ID        string
	Player1   *ArenaClient
	Player2   *ArenaClient
	IsBot     bool
	Challenge DuelChallenge
	mu        sync.Mutex
	Closed    bool
}

type ArenaHub struct {
	clients    map[*ArenaClient]bool
	waiting    []*ArenaClient
	rooms      map[string]*ArenaRoom
	register   chan *ArenaClient
	unregister chan *ArenaClient
	mu         sync.Mutex
}

func NewArenaHub() *ArenaHub {
	return &ArenaHub{
		clients:    make(map[*ArenaClient]bool),
		waiting:    make([]*ArenaClient, 0),
		rooms:      make(map[string]*ArenaRoom),
		register:   make(chan *ArenaClient),
		unregister: make(chan *ArenaClient),
	}
}

func (h *ArenaHub) Run() {
	// Background queue checker for bot matchmaker if no human opponent joins
	go func() {
		ticker := time.NewTicker(2 * time.Second)
		defer ticker.Stop()
		for range ticker.C {
			h.checkWaitingBots()
		}
	}()

	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			h.waiting = append(h.waiting, client)
			h.mu.Unlock()
			h.tryMatch()

		case client := <-h.unregister:
			h.mu.Lock()
			delete(h.clients, client)
			// Remove from waiting queue
			for i, c := range h.waiting {
				if c == client {
					h.waiting = append(h.waiting[:i], h.waiting[i+1:]...)
					break
				}
			}
			h.mu.Unlock()
			close(client.Send)
		}
	}
}

func (h *ArenaHub) tryMatch() {
	h.mu.Lock()
	defer h.mu.Unlock()

	if len(h.waiting) >= 2 {
		p1 := h.waiting[0]
		p2 := h.waiting[1]
		h.waiting = h.waiting[2:]

		h.createMatch(p1, p2, false)
	}
}

func (h *ArenaHub) checkWaitingBots() {
	h.mu.Lock()
	defer h.mu.Unlock()

	if len(h.waiting) == 1 {
		p1 := h.waiting[0]
		h.waiting = h.waiting[1:]

		// Create simulated competitive rival
		botNames := []string{"Alex (Oxford)", "Sophie (Toronto)", "Marcus (Stanford)", "Elena (Melbourne)", "Liam (MIT)"}
		botName := botNames[rand.Intn(len(botNames))]
		botElo := p1.ELO + rand.Intn(60) - 30
		if botElo < 1000 {
			botElo = 1050
		}

		bot := &ArenaClient{
			ID:   "bot-" + uuid.New().String()[:8],
			Name: botName,
			ELO:  botElo,
			Send: make(chan []byte, 10),
		}

		h.createMatch(p1, bot, true)
	}
}

func (h *ArenaHub) createMatch(p1, p2 *ArenaClient, isBot bool) {
	roomID := "room-" + uuid.New().String()[:8]
	challenge := ArenaChallenges[rand.Intn(len(ArenaChallenges))]

	room := &ArenaRoom{
		ID:        roomID,
		Player1:   p1,
		Player2:   p2,
		IsBot:     isBot,
		Challenge: challenge,
	}

	p1.Room = room
	p2.Room = room
	h.rooms[roomID] = room

	// Send match_found to player 1
	p1MatchMsg, _ := json.Marshal(map[string]interface{}{
		"type": "match_found",
		"payload": map[string]interface{}{
			"roomId":       roomID,
			"opponentName": p2.Name,
			"opponentElo":  p2.ELO,
			"isBot":        isBot,
			"challenge":    challenge,
		},
	})
	p1.Send <- p1MatchMsg

	if !isBot && p2.Conn != nil {
		p2MatchMsg, _ := json.Marshal(map[string]interface{}{
			"type": "match_found",
			"payload": map[string]interface{}{
				"roomId":       roomID,
				"opponentName": p1.Name,
				"opponentElo":  p1.ELO,
				"isBot":        false,
				"challenge":    challenge,
			},
		})
		p2.Send <- p2MatchMsg
	}

	// If playing with a bot, simulate realistic typing progression
	if isBot {
		go h.runBotSimulator(room, p1, p2)
	}
}

func (h *ArenaHub) runBotSimulator(room *ArenaRoom, human, bot *ArenaClient) {
	totalSteps := 12
	baseWpm := 45 + rand.Intn(15)

	for step := 1; step <= totalSteps; step++ {
		time.Sleep(time.Duration(3500+rand.Intn(1800)) * time.Millisecond)

		room.mu.Lock()
		if room.Closed {
			room.mu.Unlock()
			return
		}
		room.mu.Unlock()

		progressPct := int(float64(step) / float64(totalSteps) * 100)
		jitterWpm := baseWpm + rand.Intn(8) - 4

		msg, _ := json.Marshal(map[string]interface{}{
			"type": "opponent_progress",
			"payload": map[string]interface{}{
				"progressPct": progressPct,
				"currentWpm":  jitterWpm,
				"accuracy":    0.85 + (float64(rand.Intn(15)) / 100.0),
			},
		})

		select {
		case human.Send <- msg:
		default:
		}
	}

	// Bot finishes
	botResult := &FinishPayload{
		TimeTakenSec: 48.0 + float64(rand.Intn(8)),
		Accuracy:     0.90,
		WordsCorrect: len(room.Challenge.Blanks),
	}
	bot.Result = botResult
	bot.IsFinished = true

	h.evaluateMatch(room)
}

func (h *ArenaHub) evaluateMatch(room *ArenaRoom) {
	room.mu.Lock()
	defer room.mu.Unlock()

	if room.Closed || room.Player1.Result == nil || room.Player2.Result == nil {
		return
	}
	room.Closed = true

	p1 := room.Player1
	p2 := room.Player2

	// Calculate winner: based on accuracy & time
	p1Score := p1.Result.Accuracy*100.0 - p1.Result.TimeTakenSec*0.5
	p2Score := p2.Result.Accuracy*100.0 - p2.Result.TimeTakenSec*0.5

	var p1Won bool
	if p1Score >= p2Score {
		p1Won = true
	} else {
		p1Won = false
	}

	// ELO calculation: standard logistic curve
	expectedP1 := 1.0 / (1.0 + math.Pow(10, float64(p2.ELO-p1.ELO)/400.0))
	kFactor := 32.0

	var actualScoreP1 float64
	if p1Won {
		actualScoreP1 = 1.0
	} else {
		actualScoreP1 = 0.0
	}

	deltaEloP1 := int(math.Round(kFactor * (actualScoreP1 - expectedP1)))
	if deltaEloP1 == 0 && p1Won {
		deltaEloP1 = 8
	} else if deltaEloP1 == 0 && !p1Won {
		deltaEloP1 = -8
	}

	p1NewElo := p1.ELO + deltaEloP1
	p2NewElo := p2.ELO - deltaEloP1

	// Send result to P1
	res1, _ := json.Marshal(map[string]interface{}{
		"type": "match_result",
		"payload": map[string]interface{}{
			"won":         p1Won,
			"yourElo":     p1NewElo,
			"deltaElo":    deltaEloP1,
			"opponentElo": p2NewElo,
			"yourTime":    p1.Result.TimeTakenSec,
			"oppTime":     p2.Result.TimeTakenSec,
		},
	})
	p1.Send <- res1

	// Send result to P2 if not bot
	if !room.IsBot && p2.Conn != nil {
		res2, _ := json.Marshal(map[string]interface{}{
			"type": "match_result",
			"payload": map[string]interface{}{
				"won":         !p1Won,
				"yourElo":     p2NewElo,
				"deltaElo":    -deltaEloP1,
				"opponentElo": p1NewElo,
				"yourTime":    p2.Result.TimeTakenSec,
				"oppTime":     p1.Result.TimeTakenSec,
			},
		})
		p2.Send <- res2
	}
}

type ArenaHandler struct {
	hub *ArenaHub
}

func NewArenaHandler(hub *ArenaHub) *ArenaHandler {
	return &ArenaHandler{hub: hub}
}

func (h *ArenaHandler) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}

	client := &ArenaClient{
		ID:   uuid.New().String(),
		Name: "Candidate",
		ELO:  1200,
		Conn: conn,
		Send: make(chan []byte, 256),
	}

	// Writer pump
	go func() {
		defer func() {
			_ = conn.Close()
		}()
		for message := range client.Send {
			_ = conn.WriteMessage(websocket.TextMessage, message)
		}
	}()

	// Reader pump
	defer func() {
		h.hub.unregister <- client
		_ = conn.Close()
	}()

	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			break
		}

		var msg ArenaMessage
		if err := json.Unmarshal(message, &msg); err != nil {
			continue
		}

		switch msg.Type {
		case "join_queue":
			var p JoinQueuePayload
			_ = json.Unmarshal(msg.Payload, &p)
			if p.PlayerName != "" {
				client.Name = p.PlayerName
			}
			if p.PlayerELO > 0 {
				client.ELO = p.PlayerELO
			}
			h.hub.register <- client

		case "player_progress":
			if client.Room != nil {
				var p ProgressPayload
				_ = json.Unmarshal(msg.Payload, &p)

				oppMsg, _ := json.Marshal(map[string]interface{}{
					"type":    "opponent_progress",
					"payload": p,
				})

				opp := client.Room.Player1
				if opp == client {
					opp = client.Room.Player2
				}
				if opp != nil && !client.Room.IsBot && opp.Send != nil {
					opp.Send <- oppMsg
				}
			}

		case "player_finished":
			if client.Room != nil {
				var f FinishPayload
				_ = json.Unmarshal(msg.Payload, &f)
				client.Result = &f
				client.IsFinished = true

				h.hub.evaluateMatch(client.Room)
			}
		}
	}
}
