const buildSeatList = (rows, cols) => {
  const seats = [];
  for (let rowIndex = 0; rowIndex < rows; rowIndex += 1) {
    const rowName = String.fromCharCode(65 + rowIndex);
    for (let seatNumber = 1; seatNumber <= cols; seatNumber += 1) {
      seats.push(`${rowName}${seatNumber}`);
    }
  }
  return seats;
};

module.exports = { buildSeatList };
