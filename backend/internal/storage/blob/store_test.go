package blob

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestDiskStorePutAndDelete(t *testing.T) {
	root := t.TempDir()
	store := NewDisk(root)

	path, size, err := store.Put("clip.webm", strings.NewReader("audio-bytes"))
	if err != nil {
		t.Fatalf("put: %v", err)
	}
	if size != 11 {
		t.Fatalf("size = %d, want 11", size)
	}
	if filepath.Dir(path) != root {
		t.Fatalf("stored outside root: %s", path)
	}
	raw, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("read: %v", err)
	}
	if string(raw) != "audio-bytes" {
		t.Fatalf("content = %q", raw)
	}
	if err := store.Delete(path); err != nil {
		t.Fatalf("delete: %v", err)
	}
}
