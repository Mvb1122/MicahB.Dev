// Decrypt the user's password.
function decrypt(encrypted, username) {
    encrypted = encrypted.split("_");
    let charCode = username.charCodeAt(0) % 10;
    let encodedPassword = "";
    for (let i = 0; i < encrypted.length - 1; i++) {
        encodedPassword += String.fromCharCode((encrypted[i] >> charCode));
    }

    return encodedPassword;
}

module.exports = { decrypt }