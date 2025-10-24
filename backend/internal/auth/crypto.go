package auth

import (
	"encoding/hex"
	"errors"
	"strings"

	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
)

func EIP191Hash(message string) []byte {
	prefix := "\x19Ethereum Signed Message:\n" + strconvLen(len(message))
	return crypto.Keccak256([]byte(prefix), []byte(message))
}

// микро-оптимизация без fmt
func strconvLen(n int) string {
	if n == 0 {
		return "0"
	}
	var b [20]byte
	i := len(b)
	for n > 0 {
		i--
		b[i] = byte('0' + n%10)
		n /= 10
	}
	return string(b[i:])
}

func hexToSigBytes(sigHex string) ([]byte, error) {
	sigHex = strings.TrimPrefix(sigHex, "0x")
	b, err := hex.DecodeString(sigHex)
	if err != nil {
		return nil, err
	}
	if len(b) != 65 {
		return nil, errors.New("bad sig len")
	}
	if b[64] == 0 || b[64] == 1 {
		b[64] += 27
	}
	return b, nil
}

func VerifyEOA(hash []byte, signature string, expected common.Address) (bool, error) {
	sig, err := hexToSigBytes(signature)
	if err != nil {
		return false, err
	}
	pub, err := crypto.SigToPub(hash, sig)
	if err != nil {
		return false, err
	}
	recovered := crypto.PubkeyToAddress(*pub)
	return strings.EqualFold(recovered.Hex(), expected.Hex()), nil
}

func IsContract(rpc *ethclient.Client, addr common.Address) (bool, error) {
	code, err := rpc.CodeAt(nil, addr, nil) // latest
	if err != nil {
		return false, err
	}
	return len(code) > 0, nil
}

const erc1271ABIJSON = `[{"constant":true,"inputs":[{"name":"_hash","type":"bytes32"},{"name":"_signature","type":"bytes"}],"name":"isValidSignature","outputs":[{"name":"magicValue","type":"bytes4"}],"payable":false,"stateMutability":"view","type":"function"}]`

var magicValue = [4]byte{0x16, 0x26, 0xBA, 0x7E}

func VerifyERC1271(rpc *ethclient.Client, contract common.Address, hash []byte, sigHex string) (bool, error) {
	sig, err := hex.DecodeString(strings.TrimPrefix(sigHex, "0x"))
	if err != nil {
		return false, err
	}

	parsed, err := abi.JSON(strings.NewReader(erc1271ABIJSON))
	if err != nil {
		return false, err
	}
	data, err := parsed.Pack("isValidSignature", common.BytesToHash(hash), sig)
	if err != nil {
		return false, err
	}

	type CallArgs struct {
		To   common.Address `json:"to"`
		Data string         `json:"data"`
	}
	var out string
	if err := rpc.Client().Call(&out, "eth_call", CallArgs{To: contract, Data: "0x" + hex.EncodeToString(data)}, "latest"); err != nil {
		return false, err
	}
	outBytes, err := hex.DecodeString(strings.TrimPrefix(out, "0x"))
	if err != nil || len(outBytes) < 4 {
		return false, errors.New("bad 1271 resp")
	}
	return outBytes[0] == magicValue[0] && outBytes[1] == magicValue[1] && outBytes[2] == magicValue[2] && outBytes[3] == magicValue[3], nil
}
