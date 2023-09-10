const _ = require('underscore');
const { ObjectId } = require('mongodb');

function annualScores(data) {
  const TOTAL_SCORES = 8;
  const groupedByName = _.groupBy(data, 'competitor');
  const competitors = Object.keys(groupedByName);

  const topScores = competitors.map((competitor) => ({
    [competitor]: groupedByName[competitor]
      .sort((a, b) => b.rank - a.rank || b.score.localeCompare(a.score))
      .slice(0, TOTAL_SCORES),
  }));

  const addTogether = (objectArray, property) =>
    objectArray.reduce((acc, o) => acc + o[property], 0);

  const results = topScores.map((c, i) => ({
    ...c,
    timesShot: groupedByName[competitors[i]].length,
    points: addTogether(c[competitors[i]], 'rank'),
    score: addTogether(c[competitors[i]], 'points'),
    vbull: addTogether(c[competitors[i]], 'vbull'),
    name: competitors[i],
  }));

  const sortedScores = _.chain(results)
    .sortBy('vbull')
    .sortBy('score')
    .sortBy('points')
    .value();

  return sortedScores.reverse();
}

function getScore(points, bull) {
  return {
    vbull: parseInt(bull.toString().substr(0, 2)),
    score: `${parseInt(points)}.${bull.toString().padEnd(3, '0')}`,
  };
}

async function rankResults(db, query) {
  let collection = db.collection('results');
  let results = await collection.aggregate(query).toArray();

  // sort array by scores
  const scoreSorted = results.sort(
    (a, b) => parseFloat(b.score) - parseFloat(a.score)
  );

  // group the results by class
  const rankedResults = _.groupBy(_.sortBy(scoreSorted, 'classid'), 'classid');

  // mutate the objects rank to apply scores
  Object.keys(rankedResults).map((key) => {
    let MAX_POINTS = 10;
    return rankedResults[key].forEach((result) => {
      if (result.club === 1 && result.points > 0 && MAX_POINTS > 0) {
        result.rank = --MAX_POINTS + 1;
      } else {
        result.rank = 0;
      }
    });
  });

  // flatten the object from grouped keys
  const rankedPoints = _.flatten(Object.values(rankedResults)).map(
    ({ _id, rank }) => ({
      updateOne: {
        filter: { _id: new ObjectId(_id) },
        update: { $set: { rank } },
      },
    })
  );

  collection.bulkWrite(rankedPoints);

  return rankedPoints;
}

module.exports = {
  annualScores,
  getScore,
  rankResults,
};
