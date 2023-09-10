const ranking = (competitionId = 1) => [
  {
    $match: {
      compid: competitionId,
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
      _id: 1,
      classid: 1,
      club: '$competitor.club',
      name: '$competitor.name',
      points: 1,
      rank: 1,
      score: 1,
    },
  },
];

module.exports = {
  ranking,
};
