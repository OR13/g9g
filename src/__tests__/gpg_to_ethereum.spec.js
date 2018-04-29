import _sodium from 'libsodium-wrappers';
let sodium;

const openpgp = require('openpgp');
const Wallet = require('ethereumjs-wallet');
const utils = require('ethereumjs-util');

describe('gpg_to_ethereum', () => {
  beforeAll(async () => {
    await _sodium.ready;
    sodium = _sodium;
  });

  it('openpgp -> libsodium -> ethereumjs-wallet', async () => {
    const options = {
      userIds: [{ name: 'Jon Smith', email: 'jon@example.com' }], // multiple user IDs
      curve: 'ed25519', // ECC curve name
      passphrase: 'super long and hard to guess secret' // protects the private key
    };
    const jon_smith_pgp = await openpgp.generateKey(options);
    const publicKey = openpgp.key.readArmored(jon_smith_pgp.publicKeyArmored)
      .keys[0];
    const publicKeyHex = sodium
      .to_hex(publicKey.primaryKey.params[1].data)
      .substring(2);
    // console.log(publicKeyHex);
    const privateKey = openpgp.key.readArmored(jon_smith_pgp.privateKeyArmored)
      .keys[0];
    const privateKeyIsDecrypted = await privateKey.decrypt(options.passphrase);
    const privateKeyHex =
      sodium.to_hex(privateKey.primaryKey.params[2].data) + publicKeyHex;
    // console.log({
    //   publicKeyHex,
    //   publicKeyLength: publicKeyHex.length,
    //   privateKeyLength: privateKeyHex.length
    // });
    const message = `my message`;
    const primary_attestation = sodium.crypto_sign_detached(
      message,
      sodium.from_hex(privateKeyHex)
    );
    const data = sodium.crypto_sign_verify_detached(
      primary_attestation,
      message,
      sodium.from_hex(publicKeyHex)
    );
    // console.log(data);
    const curve25519_privateKey = sodium.crypto_sign_ed25519_sk_to_curve25519(
      sodium.from_hex(privateKeyHex)
    );
    const wallet = Wallet.fromPrivateKey(
      new Buffer(sodium.to_hex(curve25519_privateKey), 'hex')
    );
    const msg = 'hello';
    const msg_hash = utils.sha3(msg);

    // ECDSA
    const { v, r, s } = utils.ecsign(msg_hash, wallet._privKey);
    const pubKey = utils.ecrecover(msg_hash, v, r, s);
    const addr = utils.pubToAddress(pubKey);
    const wallet_address = '0x' + wallet.getAddress().toString('hex');
    expect('0x' + addr.toString('hex')).toBe(wallet_address);
  });

  //   it('gpg tools', async () => {
  //     const ed25519_armored_pk = `
  // -----BEGIN PGP PUBLIC KEY BLOCK-----
  // Comment: GPGTools - https://gpgtools.org

  // mDMEWuXtARYJKwYBBAHaRw8BAQdAa5pCIOs7QkLymdnO39Y7Aa9gzvTMLKVFt02X
  // itvd3MG0BUFsaWNliJUEExYKAD4WIQSWPmhIVz2CdNiSHwc1aEyXC9OaDwUCWuXt
  // AQIbIwUJAAFRgAULCQgHAwUVCgkICwUWAgMBAAIeAQIXgAAKCRA1aEyXC9OaD9EM
  // AQDYW0A8vTPMc4dINNa3KKB87vytICgqBRTDddmmuPAqmwD4n9F/OWbkThbkcn5I
  // ECgovd3Osz3fie7GKUX8YCjWDw==
  // =Ortp
  // -----END PGP PUBLIC KEY BLOCK-----`;

  //     let pub_key_uint8 = openpgp.armor.decode(ed25519_armored_pk.trim()).data;

  //     console.log(pub_key_uint8.length);
  //   });

  //   it('sodium -> openpgp', async () => {
  //     var options = {
  //       userIds: [{ name: 'Jon Smith', email: 'jon@example.com' }], // multiple user IDs
  //       curve: 'ed25519', // ECC curve name
  //       passphrase: 'super long and hard to guess secret' // protects the private key
  //     };

  //     let key = await openpgp.generateKey(options);

  //     console.log(key.publicKeyArmored)

  //     // console.log(openpgp.armor.decode(key.publicKeyArmored))
  //     let pub_key_uint8 = openpgp.armor.decode(key.publicKeyArmored).data;
  //     let pub_encoded_hex = sodium.to_hex(pub_key_uint8)

  //     console.log(pub_encoded_hex);

  //     // console.log(key)

  //     // const keypair = sodium.crypto_sign_keypair();

  //     // let armored = openpgp.armor.encode(keypair.publicKey);

  //     // console.log(armored);
  //   });

  afterAll(() => {});
});

// console.log(sodium.to_hex(pub_key_uint8))

// var privkey = key.privateKeyArmored; // '-----BEGIN PGP PRIVATE KEY BLOCK ... '
// var pubkey = key.publicKeyArmored; // '-----BEGIN PGP PUBLIC KEY BLOCK ... '

//
// console.log(sodium.to_hex(keypair.publicKey));

// console.log();
// console.log(pubkey);

// let pub_key_b64 = clean_pup(ed25519_gpg_pub);
// let pub_key_buf = new Buffer(pub_key_b64, 'base64');
// let pub_key_hex = pub_key_buf.toString('hex');

// let pub_key_curve25519 = sodium.crypto_sign_ed25519_pk_to_curve25519(
//     pub_key_uint8
// );
// console.log(pub_key_curve25519);
