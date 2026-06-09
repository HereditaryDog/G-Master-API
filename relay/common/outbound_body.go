package common

import (
	"io"

	"github.com/yangjunyu/G-Master-API/common"
)

// NewOutboundJSONBody wraps a marshaled upstream request body into BodyStorage.
// When disk cache is enabled and the payload crosses the configured threshold,
// the bytes can move out of heap while the upstream request is in flight.
func NewOutboundJSONBody(data []byte) (body io.Reader, size int64, closer io.Closer, err error) {
	storage, err := common.CreateBodyStorage(data)
	if err != nil {
		return nil, 0, nil, err
	}
	return common.ReaderOnly(storage), storage.Size(), storage, nil
}
