#!/bin/sh

# Create a Key
gpg --batch --yes --no-tty --gen-key ./docs/alice.eddsa
echo 'hello' `date +%s` > ./docs/doc

# Encrypt & Decrypt
echo 'secret' | gpg --batch --passphrase-fd 0 --no-tty -c ./docs/doc
echo 'secret' | gpg --batch --passphrase-fd 0 --no-tty -d ./docs/doc.gpg 

# Sign and Verify
echo "secret" | PASSPHRASE="secret" gpg --batch --pinentry-mode loopback --command-fd 0 --output ./docs/doc.sig --sign --detach-sig ./docs/doc
gpg --verify ./docs/doc.sig ./docs/doc 

# Export a Public Key
gpg --export -a "Alice" > ./docs/public.key
# cat public.key

# Export a Private Key
echo "secret" | PASSPHRASE="secret" gpg --batch --pinentry-mode loopback --command-fd 0 --export-secret-key -a "Alice" > ./docs/private.key
# cat private.key