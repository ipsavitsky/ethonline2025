package auth

import (
	"errors"
	"fmt"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/ethereum/go-ethereum/common"
)

func BuildSiweString(domain, address, uri, version string, chainID int64, nonce, issuedAt, expAt, statement string) string {
	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("%s wants you to sign in with your Ethereum account:\n", domain))
	sb.WriteString(fmt.Sprintf("%s\n\n", address))
	if statement != "" {
		sb.WriteString(statement + "\n\n")
	}
	sb.WriteString(fmt.Sprintf("URI: %s\n", uri))
	sb.WriteString(fmt.Sprintf("Version: %s\n", version))
	sb.WriteString(fmt.Sprintf("Chain ID: %d\n", chainID))
	sb.WriteString(fmt.Sprintf("Nonce: %s\n", nonce))
	sb.WriteString(fmt.Sprintf("Issued At: %s\n", issuedAt))
	sb.WriteString(fmt.Sprintf("Expiration Time: %s\n", expAt))
	return sb.String()
}

type SiweParsed struct {
	Domain, Address, URI, Version, Nonce string
	ChainID                              int64
	IssuedAt, Expires                    time.Time
}

var (
	reFirstLine = regexp.MustCompile(`^([^\s]+)\s+wants you to sign in with your Ethereum account:`)
	reAddress   = regexp.MustCompile(`\n(0x[0-9a-fA-F]{40})\n`)
	reURI       = regexp.MustCompile(`(?m)^URI:\s*(\S+)`)
	reVersion   = regexp.MustCompile(`(?m)^Version:\s*([0-9]+)`)
	reChain     = regexp.MustCompile(`(?m)^Chain ID:\s*([0-9]+)`)
	reNonce     = regexp.MustCompile(`(?m)^Nonce:\s*([A-Za-z0-9]+)`)
	reIssued    = regexp.MustCompile(`(?m)^Issued At:\s*([^\n]+)`)
	reExp       = regexp.MustCompile(`(?m)^Expiration Time:\s*([^\n]+)`)
)

func ParseSiwe(s string) (*SiweParsed, error) {
	m1 := reFirstLine.FindStringSubmatch(s)
	m2 := reAddress.FindStringSubmatch(s)
	if len(m1) < 2 || len(m2) < 2 {
		return nil, errors.New("bad header")
	}
	p := &SiweParsed{Domain: m1[1], Address: common.HexToAddress(m2[1]).Hex()}
	if m := reURI.FindStringSubmatch(s); len(m) == 2 {
		p.URI = m[1]
	} else {
		return nil, errors.New("no uri")
	}
	if m := reVersion.FindStringSubmatch(s); len(m) == 2 {
		p.Version = m[1]
	} else {
		return nil, errors.New("no version")
	}
	if m := reChain.FindStringSubmatch(s); len(m) == 2 {
		n, _ := strconv.ParseInt(m[1], 10, 64)
		p.ChainID = n
	} else {
		return nil, errors.New("no chain")
	}
	if m := reNonce.FindStringSubmatch(s); len(m) == 2 {
		p.Nonce = m[1]
	} else {
		return nil, errors.New("no nonce")
	}
	if m := reIssued.FindStringSubmatch(s); len(m) == 2 {
		t, err := time.Parse(time.RFC3339, strings.TrimSpace(m[1]))
		if err != nil {
			return nil, err
		}
		p.IssuedAt = t
	} else {
		return nil, errors.New("no issuedAt")
	}
	if m := reExp.FindStringSubmatch(s); len(m) == 2 {
		t, err := time.Parse(time.RFC3339, strings.TrimSpace(m[1]))
		if err != nil {
			return nil, err
		}
		p.Expires = t
	} else {
		return nil, errors.New("no exp")
	}
	return p, nil
}
