const { db, admin } = require('../util/admin');

const config = require('../util/config.js');

const firebase = require('firebase');
firebase.initializeApp(config);

const { validateSignupData, validateLoginData } = require('../util/validation');


// ========================
// ======== SIGNUP ========
// ========================
exports.signup = (req, res) => {
    const newUser = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
    };

    const { valid, errors } = validateSignupData(newUser);

    if (!valid) return res.status(400).json(errors);

    let token, userId;
    firebase
        .auth()
        .createUserWithEmailAndPassword(newUser.email, newUser.password)
        .then(data => {
            userId = data.user.uid;
            return data.user.getIdToken()
        })
        .then(idToken => {
            token = idToken;
            const userCredentials = {
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                email: newUser.email,
                userId,
                imageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/no-img.png?alt=media`,
                dateCreated: new Date().toISOString(),
            }
            return db.doc(`/users/${userId}`).set(userCredentials)
        })
        .then(() => {
            return res.status(201).json({ token })
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({ general: 'Something went wrong, please try again' })
        })
};

// =========================
// ========= LOGIN =========
// =========================

exports.login = (req, res) => {
    const user = {
        email: req.body.email,
        password: req.body.password
    }

    const { valid, errors } = validateLoginData(user);

    if (!valid) return res.status(400).json(errors);

    firebase.auth().signInWithEmailAndPassword(user.email, user.password)
        .then(data => {
            return data.user.getIdToken()
        })
        .then((token) => {
            return res.json({ token })
        })
        .catch(err => {
            console.error(err)
            return res.status(403).json({ general: "Wrong credentials, please try again" })
        })
}

// ==========================
// ========= UPLOAD =========
// ========== IMAGE =========
// ==========================

exports.uploadImage = (req, res) => {
    const BusBoy = require('busboy');
    const path = require('path');
    const os = require('os');
    const fs = require('fs');

    busboy = new BusBoy({ headers: req.headers });

    let imageFileName;
    let imageToBeUploaded = {};

    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        if (mimetype !== 'image/jpeg' && mimetype !== 'image/png') {
            return res.status(400).json({ error: 'Invalid file type' })
        }
        const imageExtension = filename.split('.')[filename.split('.').length - 1];
        imageFileName = `${Math.round(Math.random() * 1000000000)}.${imageExtension}`;
        const filepath = path.join(os.tmpdir(), imageFileName);
        imageToBeUploaded = { filepath, mimetype };

        file.pipe(fs.createWriteStream(filepath));
    });
    busboy.on('finish', () => {
        admin
            .storage().bucket().upload(imageToBeUploaded.filepath, {
                resumable: false,
                metadata: {
                    metadata: {
                        contentType: imageToBeUploaded.mimetype
                    }
                }
            })
            .then(() => {
                const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`
                return db.doc(`/users/${req.user.userId}`).update({ imageUrl });
            })
            .then(() => {
                return res.json({ message: "Image uploaded successfully" })
            })
            .catch(err => {
                console.error(err);
                return res.status(500).json({ error: err.code })
            })
    });
    busboy.end(req.rawBody);

}

// Get own user details

exports.getAuthenticatedUser = (req, res) => {
    let userData = {}
    db.doc(`/users/${req.user.userId}`).get().then(doc => {
        if (doc.exists) {
            userData.credentials = doc.data();
            return db.collection('lessons').where('userId', '==', req.user.uid).get();
        }
    })
        .then(data => {
            userData.lessons = []
            data.forEach(doc => {
                userData.lessons.push(doc.data());
            });
            return db.collection('events').where('userId', '==', req.user.uid).get();
        })
        .then(data => {
            userData.events = []
            data.forEach(doc => {
                userData.events.push(doc.data())
            })
            return db.collection('students').where('userId', '==', req.user.uid).get();
        })
        .then(data => {
            userData.students = []
            data.forEach(doc => {
                userData.students.push(doc.data())
            })
            return res.json(userData)
        })
        .catch(err => {
            console.error(err)
            return res.status(500).json({ error: err.code })
        })
}