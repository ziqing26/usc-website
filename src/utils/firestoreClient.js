import ImageCompressor from 'image-compressor.js';
import _ from 'lodash'

export function uploadFile(firebase, filePath, file, callback) {
  (new ImageCompressor()).compress(file, {
    quality: .6,
    convertSize: 1000000})
    .then((result) => {
      firebase
      .uploadFile(filePath, result)
      .then((snapshot) => {
        callback(snapshot.uploadTaskSnaphot.metadata.fullPath)
      })
    })
    .catch((err) => {
      console.log(err.message);
    })
}

export function deleteFile(firebase, path, callback) {
  firebase
  .storage()
  .ref(path)
  .delete()
  .then(() => callback())
}

export function formatFirestoreEvent(event, uid, googleEventID) {
  if(event.regLink && !(event.regLink.startsWith("http://") || event.regLink.startsWith("https://"))) {
    event = {
      ...event,
      regLink: "http://" + event.regLink
    }
  }

  if(googleEventID) {
    event = {
      ...event,
      gCalID: googleEventID
    }
  }

  return {
    name: event.name,
    type: event.type,
    internal: event.internal,
    spaceOnly: event.spaceOnly,
    venue: event.otherVenueSelected ? event.otherVenue : event.venue,
    otherVenueSelected: event.otherVenueSelected,
    otherVenue: null,
    multiDay: event.multiDay,
    fullDay: event.fullDay,
    startDate: event.startDate.toDate(),
    endDate: event.endDate.toDate(),
    poster: event.poster,
    description: event.description,
    regLink: event.regLink,
    creator: uid,
    original: null,
  }
}

export function formatFirestoreGroup(group, type) {
  switch (type) {
    case 'interestGroup':
      return {
        name: group.name,
        type: group.type,
        description: group.description,
        activities: group.activities,
        support: group.support,
        leaderID: group.members[0].id
      }
      break
    default:
      break
  }
}

export function createEvent(firestore, event, uid, googleEventID, callback) {
  firestore
  .add({ collection: 'events' }, formatFirestoreEvent(event, uid, googleEventID))
  .then(() => callback())
}

export function updateEvent(firestore, event, uid, callback) {
  console.log(formatFirestoreEvent(event, uid))
  firestore
  .set({ collection: 'events', doc: event.id }, formatFirestoreEvent(event, uid))
  .then(() => callback())
}

export function deleteEvent(firestore, event, callback) {
  firestore
  .delete({ collection: 'events', doc: event.id })
  .then(() => callback())
}

export function getEvents(firestore, callback = () => {}, month = null, spaceOnly = false, startInMonth = true) {
  var query = { collection: 'events', orderBy: ['startDate'] }
  var where = []

  if (month) {
    const dateField = startInMonth ? 'startDate' : 'endDate'
    where.push([dateField, '>=', month.clone().startOf('month').add(-1, 'month').toDate()])
    where.push([dateField, '<=', month.clone().endOf('month').add(1, 'month').toDate()])

    const nameField = startInMonth ? 'eventsStartInMth' : 'eventsEndInMth'
    query = {
      ...query,
      storeAs: nameField,
      orderBy: [dateField]
    }
  }

  if (spaceOnly) {
    where.push(['otherVenueSelected', '==', false])
  }

  if (where.length > 0) {
    query = {
      ...query,
      where: where
    }
  }

  firestore
  .get(query)
  .then(() => callback())
}

export function getEventsAfter(firestore, callback, alias, date, limit) {
  firestore
  .get({
    collection: 'events',
    where: [
      ['endDate', '>=', date.toDate()]
    ],
    orderBy: ['endDate'],
    storeAs: alias,
    limit: limit})
}

export function getEvent(firestore, eventID) {
  firestore
  .get({
    collection: 'events',
    doc: eventID,
    storeAs: 'event'})
}

export function getUserEvents(firestore, userID) {
  firestore
  .get({
    collection: 'events',
    where: [
      ['creator', '==', userID]
    ],
    orderBy: ['startDate'],
    storeAs: 'userEvents'})
}

export function watchEvents(firestore) {
  firestore.setListeners([
    { collection: 'events' },
  ])
}

export function getUserProfile(firestore, userID, callback, alias = 'userProfiles') {
  firestore
  .get({
    collection: 'users',
    doc: userID,
    storeAs: alias})
  .then((snapshot) => callback(snapshot))
}

export function getUserProfileByEmail(firestore, email, callback, alias = 'userProfiles') {
  firestore
  .get({
    collection: 'users',
    where: [
      ['email', '==', email]
    ],
    storeAs: alias})
    .then((snapshot) => callback(snapshot))
}

export function getEventTypes(firestore) {
  firestore
  .get({ collection: 'eventTypes', orderBy: ['name'] })
}

export function getSpaces(firestore) {
  firestore
  .get({ collection: 'spaces', orderBy: ['name'] })
}

export function getPoster(firebase, path, callback) {
  firebase
  .storage()
  .ref(path)
  .getDownloadURL()
  .then((url) => callback(url))
}

export function getInterestGroupTypes(firestore) {
  firestore
  .get({
    collection: 'groupTypes',
    orderBy: ['name'],
    where: ['category', '==', 'Interest Group'],
    storeAs: 'igTypes'
  })
}

export function createInterestGroup(firestore, interestGroup, callback) {
  firestore
  .add({ collection: 'groups' }, formatFirestoreGroup(interestGroup, 'interestGroup'))
  .then((snapshot) => {
    _.forEach(interestGroup.members, (member) => {
      firestore
      .add({ collection: 'groupMembership' }, {
        groupID: snapshot.id,
        memberID: member.id
      })
    })

    callback()
  })
}
