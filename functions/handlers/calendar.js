const { db } = require('../util/admin');
const { uuid } = require('uuidv4');


// ========================
// ========= ADD ==========
// ======= CALENDAR =======
// ======== EVENT =========
// ========================

exports.addCalendarEvent = (req, res) => {
    const id = uuid()
    const newEvent = {
        userId: req.user.userId,
        start: req.body.start,
        end: req.body.end,
        allDay: req.body.allDay,
        title: req.body.title,
        id: id
    };

    db
        .collection('events')
        .doc(id)
        .set(newEvent)
        .then(doc => {
            res.json({ message: `Event created successfully` })
        })
        .catch(err => {
            res.status(500).json({ error: 'something went wrong' });
            console.error(err);
        })
};

// ========================
// ======== DELETE ========
// ======= CALENDAR =======
// ======== EVENT =========
// ========================

exports.deleteCalendarEvent = (req, res) => {
    const event = db.doc(`/events/${req.params.eventId}`);
    event.get()
        .then(doc => {
            if (!doc.exists) {
                return res.status(404).json({ error: 'Event not found' })
            }
            if (doc.data().userId !== req.user.userId) {
                res.status(403).json({ error: "Unauthorized" })
            } else {
                return event.delete();
            }
        })
        .then(() => {
            res.json({ message: 'Event deleted successfully' })
        })
        .catch(err => {
            console.error(err)
            return res.status(500).json({ error: err.code })
        })
};

exports.getAllEvents = (req, res) => {
    db
        .collection('events')
        .get()
        .then(data => {
            let events = [];
            data.forEach((doc) => {
                events.push({
                    userId: doc.data().userId,
                    title: doc.data().title,
                    allDay: doc.data().allDay,
                    startStr: doc.data().startStr,
                    endStr: doc.data().endStr,
                    id: doc.data().id
                });
            });
            return res.json(events);
        })
        .catch(err => console.error(err))
}