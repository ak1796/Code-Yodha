const crypto = require('crypto');

const secretKey = process.env.WHISTLEBLOWER_SECRET_KEY || '64_char_hex_mock_secret_key_000000000000000000000000000000000000';

exports.encryptComplaint = function(text) {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(secretKey, 'hex'), iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    return {
      encrypted: encrypted.toString('hex'),
      iv: iv.toString('hex')
    };
  } catch (err) {
    console.error("Encryption Error:", err);
    return null;
  }
};

exports.decryptComplaint = function(encrypted, iv) {
  try {
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(secretKey, 'hex'), Buffer.from(iv, 'hex'));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(encrypted, 'hex')), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (err) {
    console.error("Decryption Error:", err);
    return "[DECRYPTION_FAILED]";
  }
};

exports.generateToken = function() {
  return crypto.randomBytes(32).toString('hex');
};
