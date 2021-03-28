const admin = require('firebase-admin');
const { db } = require('./admin');

module.exports = (req, res, next) => {
    let idToken;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        idToken = req.headers.authorization.split('Bearer ')[1];
    } else {
        console.error('No or invalid token')
        return res.status(403).json({ error: "Unauthorized" })
    }

    admin.auth().verifyIdToken(idToken)
        .then(decodedToken => {
            req.user = decodedToken;
            return db.collection('users')
                .where('userId', '==', req.user.uid)
                .limit(1)
                .get()
        })
        .then(data => {
            req.user.userId = data.docs[0].data().userId
            return next();
        })
        .catch(err => {
            console.error('Error verifying token ', err)
            return res.status(403).json(err);
        })
}