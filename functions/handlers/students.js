const { uuid } = require('uuidv4');
const { db } = require('../util/admin');

exports.addStudent = (req, res) => {

    const id = uuid()
    const newStudent = {
        userId: req.body.userId,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        phoneNumber: req.body.phoneNumber,
        email: req.body.email,
        classEnrolled: req.body.classEnrolled,
        enrollmentStatus: req.body.enrollmentStatus,
        dateCreated: new Date().toISOString(),
        id: id
    };
    db
        .collection('students')
        .doc(id)
        .set(newStudent)
        .then(doc => {
            res.json({ message: `Student added successfully` })
        })
        .catch(err => {
            console.log(newStudent)

            res.status(500).json({ error: 'something went wrong' });
            console.error(err.code);
        })
}

exports.deleteStudent = (req, res) => {
    const student = db.doc(`/students/${req.params.id}`);
    student.get()
        .then(doc => {
            if (!doc.exists) {
                return res.status(404).json({ error: 'Student not found' })
            }
            if (doc.data().userId !== req.user.userId) {
                res.status(403).json({ error: "Unauthorized" })
            } else {
                return student.delete();
            }
        })
        .then(() => {
            res.json({ message: 'Student deleted successfully' })
        })
        .catch(err => {
            console.error(err)
            return res.status(500).json({ error: err.code })
        })
}