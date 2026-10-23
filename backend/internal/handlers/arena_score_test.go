package handlers

import (
	"encoding/json"
	"testing"
)

// TestBotMatchIsUnranked protects the rating from matchmaking bots: a duel
// against the bot is a practice round and must not move the ELO.
func TestBotMatchIsUnranked(t *testing.T) {
	human := &ArenaClient{ID: "human", Name: "Human", ELO: 1420, Send: make(chan []byte, 4), Done: make(chan struct{})}
	bot := &ArenaClient{ID: "bot", Name: "Alex (Oxford)", ELO: 1500, Send: make(chan []byte, 4), Done: make(chan struct{})}
	human.Result = &FinishPayload{TimeTakenSec: 40, Accuracy: 0.9, WordsCorrect: 9}
	bot.Result = &FinishPayload{TimeTakenSec: 50, Accuracy: 0.6, WordsCorrect: 6}

	room := &ArenaRoom{ID: "room-bot", Player1: human, Player2: bot, IsBot: true}
	hub := NewArenaHub()
	hub.evaluateMatch(room)

	select {
	case raw := <-human.Send:
		var message struct {
			Type    string                 `json:"type"`
			Payload map[string]interface{} `json:"payload"`
		}
		if err := json.Unmarshal(raw, &message); err != nil {
			t.Fatalf("decode message: %v", err)
		}
		if message.Payload["ranked"] != false {
			t.Fatalf("bot match must be unranked: %v", message.Payload)
		}
		if delta, _ := message.Payload["deltaElo"].(float64); delta != 0 {
			t.Fatalf("bot match must not change the rating, got delta %v", delta)
		}
		if elo, _ := message.Payload["yourElo"].(float64); int(elo) != human.ELO {
			t.Fatalf("rating changed from %d to %v", human.ELO, elo)
		}
	default:
		t.Fatal("no match result was sent to the human player")
	}
}

// TestHumanMatchIsRanked keeps the rating meaningful for real duels.
func TestHumanMatchIsRanked(t *testing.T) {
	human := &ArenaClient{ID: "p1", Name: "P1", ELO: 1420, Send: make(chan []byte, 4), Done: make(chan struct{})}
	opponent := &ArenaClient{ID: "p2", Name: "P2", ELO: 1420, Send: make(chan []byte, 4), Done: make(chan struct{})}
	human.Result = &FinishPayload{TimeTakenSec: 30, Accuracy: 1.0, WordsCorrect: 10}
	opponent.Result = &FinishPayload{TimeTakenSec: 50, Accuracy: 0.5, WordsCorrect: 5}

	room := &ArenaRoom{ID: "room-human", Player1: human, Player2: opponent, IsBot: false}
	hub := NewArenaHub()
	hub.evaluateMatch(room)

	select {
	case raw := <-human.Send:
		var message struct {
			Payload map[string]interface{} `json:"payload"`
		}
		if err := json.Unmarshal(raw, &message); err != nil {
			t.Fatalf("decode message: %v", err)
		}
		if message.Payload["ranked"] != true {
			t.Fatalf("human duel must be ranked: %v", message.Payload)
		}
		if delta, _ := message.Payload["deltaElo"].(float64); delta <= 0 {
			t.Fatalf("a win against an equal opponent must raise the rating, got %v", delta)
		}
	default:
		t.Fatal("no match result was sent")
	}
}
