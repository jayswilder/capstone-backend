const functions = require("firebase-functions");
const app = require('express')();
const cors = require('cors')

app.use(cors());

const {
    getAllLessons,
    postALesson,
    deleteALesson
} = require('./handlers/lessons');
const { addCalendarEvent, deleteCalendarEvent, getAllEvents } = require('./handlers/calendar');

const { signup, login, uploadImage, getAuthenticatedUser } = require('./handlers/users');
const checkAuth = require('./util/checkAuth');
const { addStudent, deleteStudent } = require("./handlers/students");
// Component routes
app.get('/lessons', getAllLessons);
app.post('/lesson', checkAuth, postALesson);
app.delete('/lesson/:lessonId', checkAuth, deleteALesson)
app.get('/events', checkAuth, getAllEvents)
app.post('/calendar', checkAuth, addCalendarEvent);
app.delete('/calendar/:eventId', checkAuth, deleteCalendarEvent)
// User routes
app.post('/signup', signup);
app.post('/', login);
app.post('/user/image', checkAuth, uploadImage);
app.get('/user', checkAuth, getAuthenticatedUser);
// Student routes
app.post('/student', checkAuth, addStudent);
app.delete('/student/:id', checkAuth, deleteStudent);

exports.api = functions.https.onRequest(app);