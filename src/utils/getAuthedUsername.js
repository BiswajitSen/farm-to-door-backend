function getAuthedUsername(req) {
    return req?.user?.username || req?.auth?.username;
}

module.exports = { getAuthedUsername };


