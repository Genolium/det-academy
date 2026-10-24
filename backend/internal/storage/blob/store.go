package blob

import (
	"io"
	"os"
	"path/filepath"
)

// Store is the audio object-storage adapter. Production can point
// MEDIA_OBJECT_ROOT at a mounted bucket; local/CI use the disk adapter.
type Store interface {
	Put(name string, r io.Reader) (absPath string, size int64, err error)
	Delete(absPath string) error
	Root() string
}

type DiskStore struct {
	root string
}

func NewDisk(root string) *DiskStore {
	if root == "" {
		root = "data/media/audio"
	}
	_ = os.MkdirAll(root, 0755)
	return &DiskStore{root: root}
}

// NewFromEnv returns the disk adapter. MEDIA_S3_BUCKET documents the
// production object-storage target; without credentials the same Store
// interface still writes through a local or mounted directory.
func NewFromEnv(fallback string) Store {
	if root := os.Getenv("MEDIA_OBJECT_ROOT"); root != "" {
		fallback = root
	}
	return NewDisk(fallback)
}

func (s *DiskStore) Root() string {
	return s.root
}

func (s *DiskStore) Put(name string, r io.Reader) (string, int64, error) {
	if err := os.MkdirAll(s.root, 0755); err != nil {
		return "", 0, err
	}
	target := filepath.Join(s.root, filepath.Base(name))
	tmp, err := os.CreateTemp(s.root, "upload-*")
	if err != nil {
		return "", 0, err
	}
	tmpPath := tmp.Name()
	cleanup := func() {
		_ = tmp.Close()
		_ = os.Remove(tmpPath)
	}
	written, err := io.Copy(tmp, r)
	if err != nil {
		cleanup()
		return "", 0, err
	}
	if err := tmp.Sync(); err != nil {
		cleanup()
		return "", 0, err
	}
	if err := tmp.Close(); err != nil {
		_ = os.Remove(tmpPath)
		return "", 0, err
	}
	if written == 0 {
		_ = os.Remove(tmpPath)
		return "", 0, os.ErrInvalid
	}
	if err := os.Rename(tmpPath, target); err != nil {
		_ = os.Remove(tmpPath)
		return "", 0, err
	}
	return target, written, nil
}

func (s *DiskStore) Delete(absPath string) error {
	return os.Remove(absPath)
}
