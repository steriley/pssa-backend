const express = require('express');
const { ObjectId } = require('mongodb');

const { connect, client } = require('../db');
const queries = require('../queries/');
const isAuthenticated = require('../middleware/is-authorised');
const { annualScores, getScore, rankResults } = require('../helpers');
const usersRouter = require('./users');

const router = express.Router();
let db;

router.use('/user', usersRouter);

router.use(async (req, res, next) => {
  db = await connect();
  next();
});

const closeConnection = () => client.close();

async function createDocument(collectionName, data) {
  // TODO: shouldn't need to do this weird update with id - this is because of old legacy id use
  // refactor data and make this a straight forward insertOne
  const incrementId = (id) => parseInt(id) + 1;

  let collection = db.collection(collectionName);
  let results = await collection.find().sort({ _id: -1 }).limit(1).toArray();

  let lastId = results.length ? results[0].id : 0;
  let id = incrementId(lastId);
  let obj = { id, ...data };

  const insert = await collection.insertOne(obj);

  return {
    id,
    ...data,
    _id: insert.insertedId,
  };
}

router.get('/', (_, res) => res.json({ hello: `world` }));

router.get('/competition', async (req, res) => {
  const { published } = req.query;
  const query = published ? {} : { published: true };
  const sort = { date: -1 };
  const projection = published
    ? { _id: 1, id: 1, date: 1, distance: 1, published: 1 }
    : { _id: 0, id: 1, date: 1, distance: 1 };

  let collection = db.collection('competitions');
  let results = await collection.find(query, { sort, projection }).toArray();

  res.json(results);
});

router.get('/competition/:competitionId', async (req, res) => {
  const { competitionId } = req.params;
  const query = queries.resultTable(parseInt(competitionId));

  let collection = db.collection('results');
  let results = await collection.aggregate(query).toArray();

  res.json(results);
  closeConnection();
});

router.get('/history/:competitorId/:classId/:distance', async (req, res) => {
  const { competitorId, classId, distance } = req.params;
  const query = queries.scoreHistory(competitorId, classId, distance);

  let collection = db.collection('results');
  let results = await collection.aggregate(query).toArray();

  res.json(results);
  closeConnection();
});

router.get('/edit/competition/:id', async (req, res) => {
  const { id } = req.params;
  const query = { id: parseInt(id) };

  let collection = db.collection('competitions');
  let results = await collection.findOne(query);

  res.json(results);
  closeConnection();
});

router.put('/edit/competition/:id', isAuthenticated, async (req, res) => {
  const { _id, day, month, year, distance } = req.body;
  const query = { _id: new ObjectId(_id) };
  const $set = {
    date: new Date(`${year}-${month}-${day}`).toISOString(),
    distance,
  };

  let collection = db.collection('competitions');

  await collection.updateOne(query, { $set });

  res.json({ ...$set, _id: req.params.id });
  closeConnection();
});

router.post('/competition/create', isAuthenticated, async (req, res) => {
  const { day, month, year, distance } = req.body;
  const date = new Date(`${year}-${month}-${day}`).toISOString();
  const doc = { date, distance, published: false };

  let result = await createDocument('competitions', doc);

  res.json(result);
  closeConnection();
});

router.delete('/competition/:id', isAuthenticated, async (req, res) => {
  const id = parseInt(req.params.id);

  let collectionResults = db.collection('results');
  let collectionCompetitions = db.collection('competitions');

  await collectionResults.deleteMany({ compid: id });

  let result = await collectionCompetitions.deleteOne({ id });

  let message =
    result.deletedCount === 1
      ? `Deleted competition ${id}`
      : `No competition found to delete`;

  res.json({ message });
  closeConnection();
});

router.get('/clubs', async (_, res) => {
  let collection = db.collection('clubs');
  let results = await collection.find().sort({ club: 1 }).toArray();

  res.json(results);
  closeConnection();
});

router.post('/create/club', isAuthenticated, async (req, res) => {
  const { name } = req.body;
  const doc = { club: name };

  let result = await createDocument('clubs', doc);

  res.json(result);
  closeConnection();
});

router.get('/classes', async (_, res) => {
  let collection = db.collection('classes');
  let results = await collection.find().sort({ type: -1 }).toArray();

  res.json(results);
  closeConnection();
});

router.post('/create/class', isAuthenticated, async (req, res) => {
  const { name } = req.body;
  const doc = { type: name };

  let result = await createDocument('classes', doc);

  res.json(result);
  closeConnection();
});

router.get('/competitors', async (_, res) => {
  let collection = db.collection('competitors');
  let results = await collection.find().sort({ name: 1 }).toArray();

  res.json(results);
  closeConnection();
});

router.post('/create/competitor', isAuthenticated, async (req, res) => {
  const { name, club } = req.body;
  const doc = { name, club: parseInt(club) };

  let result = await createDocument('competitors', doc);

  res.json(result);
  closeConnection();
});

router.post('/update/competitor/:id', isAuthenticated, async (req, res) => {
  const { id } = req.params;
  const query = { id: parseInt(id) };

  let collection = db.collection('competitors');
  let results = await collection.findOne(query);

  res.json(results);
  closeConnection();
});

router.put('/update/competitor/:id', isAuthenticated, async (req, res) => {
  const { name, club } = req.body;
  const query = { id: parseInt(req.params.id) };
  const $set = {
    name,
    club: parseInt(club),
  };

  let collection = db.collection('competitors');

  await collection.updateOne(query, { $set });

  res.json({ message: `competitor ${name} updated` });
  closeConnection();
});

router.post('/create/result', isAuthenticated, async (req, res) => {
  const { classid, competid, compid, points, vbull: bull } = req.body;
  const { vbull, score } = getScore(points, bull);
  const doc = {
    compid: parseInt(compid),
    competid: parseInt(competid),
    classid: parseInt(classid),
    points: parseInt(points),
    vbull,
    score,
    rank: 0,
  };

  let result = await createDocument('results', doc);

  res.json(result);
  closeConnection();
});

router.delete('/result/:id', isAuthenticated, async (req, res) => {
  const query = { _id: new ObjectId(req.params.id) };
  let collection = db.collection('results');
  let result = await collection.deleteOne(query);

  let message =
    result.deletedCount === 1
      ? `Successfully deleted ${query._id}`
      : `No result found to delete`;

  res.json({ message });
  closeConnection();
});

router.put('/result/:id', isAuthenticated, async (req, res) => {
  const _id = new ObjectId(req.params.id);
  const { classid, competid, compid, points, vbull: bull } = req.body;
  const { vbull, score } = getScore(points, bull);
  const query = { _id };
  const $set = {
    compid: parseInt(compid),
    competid: parseInt(competid),
    classid: parseInt(classid),
    points: parseInt(points),
    vbull,
    score,
    rank: 0,
  };

  let collection = db.collection('results');

  await collection.updateOne(query, { $set });

  res.json({ ...$set, _id: req.params.id });
  closeConnection();
});

router.put('/publish/:id', isAuthenticated, async (req, res) => {
  const id = parseInt(req.params.id);
  const { published } = req.body;
  const query = { id };
  const $set = { published };

  let collection = db.collection('competitions');

  await collection.updateOne(query, { $set });

  // calculate the competitor points for published competition
  const rankQuery = queries.ranking(id);
  await rankResults(db, rankQuery);

  const message = published ? 'results published' : 'results hidden';

  res.json({ message });
  closeConnection();
});

router.put('/merge/:oldId/:newId', isAuthenticated, async (req, res) => {
  const { oldId: oldCompetitorId, newId: competitorId } = req.params;
  const query = { competid: parseInt(oldCompetitorId) };
  const update = { $set: { competid: parseInt(competitorId) } };

  let results = db.collection('results');
  let competitors = db.collection('competitors');

  await results.updateMany(query, update);
  await competitors.deleteOne({ id: parseInt(oldCompetitorId) });

  res.json({ message: 'competitor data has been merged' });
  closeConnection();
});

router.get('/overall/:year/:classId', async (req, res) => {
  const { classId, year } = req.params;
  const query = queries.annualScores(classId, year);

  let collection = db.collection('results');
  let data = await collection.aggregate(query).toArray();
  let results = annualScores(data);

  res.json(results);
  closeConnection();
});

module.exports = router;
