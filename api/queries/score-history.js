const scoreHistory = (competitorId = 1, classId = 4, distance = 1000) => [
  {
    $lookup: {
      from: 'competitors',
      localField: 'competid',
      foreignField: 'id',
      as: 'competitor',
    },
  },
  {
    $match: {
      competid: parseInt(competitorId),
      classid: parseInt(classId),
    },
  },
  {
    $lookup: {
      from: 'competitions',
      localField: 'compid',
      foreignField: 'id',
      as: 'competition',
    },
  },
  {
    $unwind: {
      path: '$competition',
    },
  },
  {
    $project: {
      _id: 0,
      date: '$competition.date',
      distance: '$competition.distance',
      points: 1,
      rank: 1,
      score: 1,
      vbull: 1,
    },
  },
  {
    $match: {
      distance: distance.toString(),
    },
  },
  {
    $project: {
      date: 1,
      points: 1,
      rank: 1,
      score: 1,
      vbull: 1,
    },
  },
  {
    $sort: {
      date: 1,
    },
  },
];

module.exports = {
  scoreHistory,
};
