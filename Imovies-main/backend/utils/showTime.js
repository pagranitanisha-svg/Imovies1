const getShowStart = (show) => {
  const startsAt = new Date(show.showDate);
  const [hours, minutes] = show.startTime.split(':').map(Number);
  startsAt.setUTCHours(hours, minutes, 0, 0);
  return startsAt;
};

module.exports = { getShowStart };
