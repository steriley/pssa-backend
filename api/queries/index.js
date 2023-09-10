const { resultTable } = require('./results');
const { scoreHistory } = require('./score-history');
const { ranking } = require('./ranking');
const { annualScores } = require('./annual-scores');

module.exports = {
  annualScores,
  ranking,
  resultTable,
  scoreHistory,
};
