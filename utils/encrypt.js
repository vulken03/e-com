const bcrypt = require("bcrypt");
const crypto = require("crypto");
const encryptPassword = (password) => {
  const saltRound = 10;
  const salt = bcrypt.genSaltSync(saltRound);
  const hash = bcrypt.hashSync(password, salt);
  const encrypedPassword = `${salt}:${hash}`;
  return encrypedPassword;
};

const validatePassword = (password, passwordHash, salt) => {
  const hash = bcrypt.hashSync(password, salt);
  if (hash === passwordHash) {
    return true;
  } else {
    return false;
  }
};

let obj = {
  email:"viraj.parmar@brainvire.com",
  password: "Viraj@123",
};

const data = JSON.stringify(obj);
const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: "pkcs1",
    format: "pem",
  },
  privateKeyEncoding: {
    type: "pkcs1",
    format: "pem",
    cipher: "aes-256-cbc",
    passphrase: "",
  },
});
console.log("publicKey: ", JSON.stringify(publicKey));
console.log("privateKey: ", JSON.stringify(privateKey));

const encryptedData = crypto.publicEncrypt(
  {
    key: publicKey,
    oaepHash: "sha256",
  },
  Buffer.from(data)
);
console.log(
  "encypted data: ",
  encodeURIComponent(encryptedData.toString("base64"))
);
//const encryptData = Buffer.from(encryptedData.toString("base64"), "base64");
const decryptRequestData = (encryptedData) => {
  const decrypt = crypto.privateDecrypt(
    {
      key: privateKey,
      passphrase: "",
      oaepHash: "sha256",
    },
    Buffer.from(decodeURIComponent(encryptedData), "base64")
  );
  console.log("decrypt", JSON.parse(decrypt));
  return JSON.parse(decrypt);
};
module.exports = {
  encryptPassword,
  validatePassword,
  decryptRequestData,
};
