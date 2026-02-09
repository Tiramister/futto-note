package main

import (
	"flag"
	"fmt"
	"os"

	"golang.org/x/crypto/bcrypt"
)

func main() {
	username := flag.String("username", "", "Username for the new user")
	password := flag.String("password", "", "Password for the new user")
	flag.Parse()

	if *username == "" {
		fmt.Fprintln(os.Stderr, "Error: -username is required")
		os.Exit(1)
	}

	if *password == "" {
		fmt.Fprintln(os.Stderr, "Error: -password is required")
		os.Exit(1)
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(*password), bcrypt.DefaultCost)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error generating password hash: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("INSERT INTO users (username, password_hash) VALUES ('%s', '%s');\n", *username, string(hash))
}
