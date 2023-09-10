const resultTable = (competitionId = 1) => [
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
    $lookup: {
      from: 'classes',
      localField: 'classid',
      foreignField: 'id',
      as: 'class',
    },
  },
  {
    $unwind: {
      path: '$class',
    },
  },
  {
    $project: {
      compid: 1,
      competid: 1,
      competitor: '$competitor.name',
      clubid: '$competitor.club',
      rank: 1,
      points: 1,
      vbull: 1,
      score: 1,
      class: '$class.type',
      classId: '$class.id',
    },
  },
  {
    $lookup: {
      from: 'clubs',
      localField: 'clubid',
      foreignField: 'id',
      as: 'club',
    },
  },
  {
    $unwind: {
      path: '$club',
    },
  },
  {
    $match: {
      compid: competitionId,
    },
  },
  {
    $project: {
      competitor: 1,
      competid: 1,
      rank: 1,
      points: 1,
      vbull: 1,
      score: 1,
      class: 1,
      club: '$club.club',
      classId: 1,
    },
  },
  {
    $sort: {
      class: 1,
      score: -1,
    },
  },
];

module.exports = {
  resultTable,
};
