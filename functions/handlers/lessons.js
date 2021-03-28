const { db } = require('../util/admin');
const { uuid } = require('uuidv4');

exports.getAllLessons = (req, res) => {
    db
        .collection('lessons')
        .orderBy('dateCreated', 'desc')
        .get()
        .then(data => {
            let lessons = [];
            data.forEach((doc) => {
                lessons.push({
                    lessonId: doc.id,
                    userId: doc.data().userId,
                    content: doc.data().content,
                    title: doc.data().title,
                    isPublished: doc.data().isPublished,
                    featuredImage: doc.data().featuredImage,
                    dateCreated: doc.data().dateCreated,
                    lastModified: doc.data().lastModified,
                    subject: doc.data().subject
                });
            });
            return res.json(lessons);
        })
        .catch(err => console.error(err))
}

exports.postALesson = (req, res) => {
    if (req.body.content.trim() === '') {
        return res.status(400).json({ content: 'Cannot be empty' });
    }
    if (req.body.title.trim() === '') {
        return res.status(400).json({ title: 'Cannot be empty' });
    }
    const id = uuid()
    const newLesson = {
        userId: req.user.userId,
        content: req.body.content,
        title: req.body.title,
        isPublished: req.body.isPublished,
        featuredImage: req.body.featuredImage,
        subject: req.body.subject,
        dateCreated: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        id: id
    };
    db
        .collection('lessons')
        .doc(id)
        .set(newLesson)
        .then(doc => {
            res.json({ message: `Lesson created successfully` })
        })
        .catch(err => {
            res.status(500).json({ error: 'something went wrong' });
            console.error(err);
        })
}

exports.deleteALesson = (req, res) => {
    const lesson = db.doc(`/lessons/${req.params.lessonId}`);
    lesson.get()
        .then(doc => {
            if (!doc.exists) {
                return res.status(404).json({ error: 'Lesson not found' })
            }
            if (doc.data().userId !== req.user.userId) {
                res.status(403).json({ error: "Unauthorized" })
            } else {
                return lesson.delete();
            }
        })
        .then(() => {
            res.json({ message: 'Lesson deleted successfully' })
        })
        .catch(err => {
            console.error(err)
            return res.status(500).json({ error: err.code })
        })
}