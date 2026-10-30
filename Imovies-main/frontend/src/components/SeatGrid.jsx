export default function SeatGrid({ rows, cols, bookedSeats, selectedSeats, onToggle, disabled }) {
  return (
    <div className="seat-grid-scroll">
      <div className="cinema-screen"><span>SCREEN</span></div>
      <div className="seat-grid" style={{ '--seat-columns': cols }}>
        {Array.from({ length: rows }, (_, rowIndex) => {
          const row = String.fromCharCode(65 + rowIndex)
          return (
            <div className="seat-row" key={row}>
              <span className="seat-row-label">{row}</span>
              {Array.from({ length: cols }, (_, seatIndex) => {
                const seat = `${row}${seatIndex + 1}`
                const booked = bookedSeats.includes(seat)
                const selected = selectedSeats.includes(seat)
                return <button key={seat} type="button" className={`seat ${booked ? 'seat-booked' : selected ? 'seat-selected' : 'seat-available'}`} aria-label={`${seat} ${booked ? 'booked' : selected ? 'selected' : 'available'}`} aria-pressed={selected} disabled={disabled || booked} onClick={() => onToggle(seat)}>{seatIndex + 1}</button>
              })}
              <span className="seat-row-label">{row}</span>
            </div>
          )
        })}
      </div>
      <div className="seat-legend"><span><i className="seat-available" />Available</span><span><i className="seat-selected" />Selected</span><span><i className="seat-booked" />Booked</span></div>
    </div>
  )
}
