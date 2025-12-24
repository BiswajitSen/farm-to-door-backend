const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    // Legacy (plaintext) password field. Kept only for backwards compatibility.
    // New signups use passwordHash and we migrate old users on login.
    password: { type: String, required: false, select: false },
    passwordHash: { type: String, required: false, select: false },
    authToken: { type: String }
});

const User = mongoose.model('User', userSchema);

module.exports = User;