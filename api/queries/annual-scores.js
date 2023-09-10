const annualScores = (classId = 1, year = 2019) => [
  {
    $match: {
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
      compid: 1,
      competid: 1,
      score: 1,
      points: 1,
      vbull: 1,
      rank: 1,
      date: {
        $dateFromString: {
          dateString: '$competition.date',
        },
      },
    },
  },
  {
    $match: {
      date: {
        $gt: new Date(String(year)),
        $lt: new Date(String(parseInt(year) + 1)),
      },
    },
  },
  {
    $lookup: {
      from: 'competitors',
      localField: 'competid',
      foreignField: 'id',
      as: 'competitor',
    },
  },
  {
    $unwind: {
      path: '$competitor',
    },
  },
  {
    $project: {
      competitor: '$competitor.name',
      clubid: '$competitor.club',
      compid: 1,
      competid: 1,
      score: 1,
      points: 1,
      vbull: 1,
      rank: 1,
      date: 1,
    },
  },
  {
    $match: {
      clubid: 1,
    },
  },
];

module.exports = {
  annualScores,
};
