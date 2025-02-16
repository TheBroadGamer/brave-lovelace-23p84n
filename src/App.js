import React, { useState, useEffect } from "react";
import Papa from "papaparse"; // CSV Parser

export default function TradingCalendar() {
  const [selectedMonth, setSelectedMonth] = useState(1); // Default to January
  const [data, setData] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null); // Track selected day
  const year = 2025;
  const [showDayView, setShowDayView] = useState(false); // Track whether day view is open

  // Define holidays with names
  const holidays = {
    "2025-01-01": "New Year's Day",
    "2025-01-09": "Jimmy Carter's Mourning",
    "2025-01-20": "Martin Luther King Jr. Day",
    "2025-02-17": "Presidents' Day",
    "2025-04-18": "Good Friday",
    "2025-05-26": "Memorial Day",
    "2025-06-19": "Juneteenth",
    "2025-07-04": "Independence Day",
    "2025-09-01": "Labor Day",
    "2025-11-27": "Thanksgiving Day",
    "2025-12-25": "Christmas Day",
  };

  // Fetch & parse CSV data
  useEffect(() => {
    fetch("/output.csv") // Ensure output.csv is in the public folder
      .then((response) => response.text())
      .then((csvText) => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
          complete: (result) => {
            const formattedData = result.data.map((row) => ({
              date: row.Open.split(" @ ")[0], // Extract date
              pl: parseFloat(row["P/L"].replace("$", "")),
              trades: 1,
              wins: row["P/L"].startsWith("-") ? 0 : 1,
              losses: row["P/L"].startsWith("-") ? 1 : 0,
            }));
            setData(formattedData);
          },
        });
      })
      .catch((error) => console.error("Error loading CSV:", error));
  }, []);

  // Function to calculate Win Rate for a day
  const calculateWinRate = (wins, totalTrades) => {
    return totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(2) : 0;
  };

  const generateDaysInMonth = (year, month) => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
    const days = Array.from({ length: firstDayOfMonth }).fill(null);

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const days = generateDaysInMonth(year, selectedMonth);
  const monthData = data.filter(
    (entry) =>
      new Date(entry.date).getMonth() + 1 === selectedMonth &&
      new Date(entry.date).getFullYear() === year
  );

  const handleDayClick = (day) => {
    setSelectedDay(day);
    setShowDayView(true);
  };

  // Aggregate data by day
  const aggregateDayData = (day) => {
    const selectedDayData = data.filter((entry) => {
      const entryDate = new Date(entry.date);
      return (
        entryDate.getDate() === day &&
        entryDate.getMonth() === selectedMonth - 1 &&
        entryDate.getFullYear() === year
      );
    });

    const totalTrades = selectedDayData.length;
    const totalWins = selectedDayData.reduce(
      (sum, trade) => sum + trade.wins,
      0
    );
    const totalLosses = selectedDayData.reduce(
      (sum, trade) => sum + trade.losses,
      0
    );
    const totalPL = selectedDayData.reduce((sum, trade) => sum + trade.pl, 0);
    const winRate = calculateWinRate(totalWins, totalTrades);

    return {
      totalTrades,
      totalWins,
      totalLosses,
      totalPL,
      winRate,
      selectedDayData,
    };
  };

  const monthTotalTrades = monthData.length;
  const monthTotalWins = monthData.reduce((sum, d) => sum + d.wins, 0);
  const monthTotalLosses = monthData.reduce((sum, d) => sum + d.losses, 0);
  const monthTotalPL = monthData.reduce((sum, d) => sum + d.pl, 0);
  const monthWinRate =
    monthTotalTrades > 0
      ? ((monthTotalWins / monthTotalTrades) * 100).toFixed(2)
      : 0;

  const handleCloseDayView = () => {
    setShowDayView(false);
    setSelectedDay(null);
  };

  // Check if a day is a weekend (Saturday or Sunday)
  const isWeekend = (day) => {
    const date = new Date(year, selectedMonth - 1, day);
    return date.getDay() === 0 || date.getDay() === 6; // Sunday or Saturday
  };

  // Check if a day is a holiday
  const isHoliday = (day) => {
    const dateStr = `${year}-${String(selectedMonth).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;
    return holidays.hasOwnProperty(dateStr); // Check if the date is in the holidays object
  };

  const totalTrades = data.length;
  const totalWins = data.reduce((sum, d) => sum + d.wins, 0);
  const totalLosses = data.reduce((sum, d) => sum + d.losses, 0);
  const totalPL = data.reduce((sum, d) => sum + d.pl, 0);
  const winRate =
    totalTrades > 0 ? ((totalWins / totalTrades) * 100).toFixed(2) : 0;

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>
        Trading Calendar -{" "}
        {new Date(year, selectedMonth - 1).toLocaleString("default", {
          month: "long",
        })}{" "}
        2025
      </h1>

      <div style={styles.mainContent}>
        {/* Day View (if showDayView is true) */}
        {showDayView ? (
          <div style={styles.dayView}>
            <button onClick={handleCloseDayView} style={styles.closeButton}>
              X
            </button>
            <h2>Details for {selectedDay}</h2>

            <div style={styles.dayStats}>
              {/* Day Summary Box */}
              <div style={styles.statBox}>
                <p>
                  <strong>P/L:</strong> $
                  {aggregateDayData(selectedDay).totalPL.toFixed(2)}
                </p>
                <p>
                  <strong>Trades:</strong>{" "}
                  {aggregateDayData(selectedDay).totalTrades}
                </p>
                <p>
                  <strong>Wins/Losses:</strong>{" "}
                  {aggregateDayData(selectedDay).totalWins}/
                  {aggregateDayData(selectedDay).totalLosses}
                </p>
                <p>
                  <strong>Win Rate:</strong>{" "}
                  {aggregateDayData(selectedDay).winRate}%
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div style={styles.calendarContainer}>
            <div style={styles.calendar}>
              {/* Weekdays (Sun, Mon, etc.) */}
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                (day, index) => (
                  <div key={index} style={styles.dayHeader}>
                    {day}
                  </div>
                )
              )}
              {/* Calendar days */}
              {days.map((day, index) => {
                if (!day) {
                  return <div key={index}></div>; // Empty cell for days before the 1st
                }

                const dayData = aggregateDayData(day); // Get the correct day data

                // Aggregate P/L, wins, and losses per day
                const dayPL = dayData.totalPL;
                const totalTrades = dayData.totalTrades;
                const totalWins = dayData.totalWins;
                const totalLosses = dayData.totalLosses;

                const winRate = dayData.winRate;

                // Styling based on performance
                let dayBackgroundColor = "";
                let titleText = "";

                if (dayPL > 0) {
                  dayBackgroundColor = "#4CAF50"; // Green for profit
                  titleText = `P/L: $${dayPL}\nTrades: ${totalTrades}\nWins/Losses: ${totalWins}/${totalLosses}`;
                } else if (dayPL < 0) {
                  dayBackgroundColor = "#FF6347"; // Red for loss
                  titleText = `P/L: $${dayPL}\nTrades: ${totalTrades}\nWins/Losses: ${totalWins}/${totalLosses}`;
                } else {
                  dayBackgroundColor = "lightgray"; // Empty days
                  titleText = "No data";
                }

                // Check if it's a weekend or holiday
                const isDisabled = isWeekend(day) || isHoliday(day);

                // Change colors for weekends and holidays
                if (isWeekend(day)) {
                  dayBackgroundColor = "gray"; // Weekends in gray
                  titleText = "Weekend"; // Show "Weekend" text
                } else if (isHoliday(day)) {
                  dayBackgroundColor = "#6A0DAD"; // MambaFX purple for holidays
                  titleText =
                    holidays[
                      `${year}-${String(selectedMonth).padStart(
                        2,
                        "0"
                      )}-${String(day).padStart(2, "0")}`
                    ] || "Holiday"; // Show holiday name or "Holiday" text
                }

                return (
                  <div
                    key={index}
                    title={titleText}
                    onClick={() => !isDisabled && handleDayClick(day)} // Prevent click on weekends/holidays
                    style={{
                      ...styles.dayCell,
                      background: dayBackgroundColor,
                      cursor: isDisabled ? "not-allowed" : "pointer", // Change cursor style
                      opacity: isDisabled ? 0.5 : 1, // Make weekends/holidays look disabled
                      position: "relative", // Allow absolute positioning of inner elements
                    }}
                  >
                    <div style={styles.dayHeader}>{day}</div>{" "}
                    {/* Date at the top-left */}
                    <div style={styles.plContainer}>
                      <p
                        style={{
                          fontWeight: "bold",
                          margin: 0,
                          fontSize: "1.7rem",
                        }}
                      >
                        P/L: ${dayPL.toFixed(2)}
                      </p>{" "}
                      {/* P/L centered */}
                    </div>
                    <div style={styles.totalTradesContainer}>
                      <p style={{ margin: 0, fontSize: "0.6rem" }}>
                        Total Trades: {totalTrades}
                      </p>{" "}
                      {/* Total trades at the bottom */}
                    </div>
                  </div>
                );
              })}
              {/* Day View (When a day is clicked) */}
              {selectedDay && (
                <div style={styles.dayView}>
                  <div style={styles.dayHeader}>
                    <button
                      onClick={() => setSelectedDay(null)}
                      style={styles.closeButton}
                    >
                      X
                    </button>
                    <h2>{`The Details for ${selectedDay}`}</h2>
                  </div>
                  <div style={styles.dayStats}>
                    {/* Day Summary Box */}
                    <div style={styles.statBox}>
                      <p>
                        <strong>P/L:</strong> ${dayPL.toFixed(2)}
                      </p>
                      <p>
                        <strong>Trades:</strong> {totalTrades}
                      </p>
                      <p>
                        <strong>Wins/Losses:</strong> {totalWins}/{totalLosses}
                      </p>
                      <p>
                        <strong>Win Rate:</strong> {winRate}%
                      </p>
                    </div>

                    {/* Individual Trade Details */}
                    <div style={styles.tradeDetails}>
                      <h3>Trade Breakdown</h3>
                      {dayData.map((trade, idx) => (
                        <div key={idx} style={styles.tradeBox}>
                          <p>
                            <strong>P/L:</strong> ${trade.pl.toFixed(2)}
                          </p>
                          <p>
                            <strong>Result:</strong>{" "}
                            {trade.wins > 0 ? "Win" : "Loss"}
                          </p>
                          {/* Additional trade info */}
                          <p>
                            <strong>Entry Price:</strong> ${trade.entryPrice}
                          </p>
                          <p>
                            <strong>Exit Price:</strong> ${trade.exitPrice}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stats */}
        {!showDayView && (
          <div style={styles.statsContainer}>
            <div style={styles.statsCard}>
              <h2>Yearly Stats:</h2>
              <p>Total Trades: {totalTrades}</p>
              <p>Total Wins: {totalWins}</p>
              <p>Total Losses: {totalLosses}</p>
              <p>Total P/L: ${totalPL.toFixed(2)}</p>
              <p>Win Rate: {winRate}%</p>
            </div>

            <div style={styles.statsCard}>
              <h2>Monthly Stats:</h2>
              <p>Total Trades: {monthTotalTrades}</p>
              <p>Total Wins: {monthTotalWins}</p>
              <p>Total Losses: {monthTotalLosses}</p>
              <p>Total P/L: ${monthTotalPL.toFixed(2)}</p>
              <p>Win Rate: {monthWinRate}%</p>
            </div>
          </div>
        )}
      </div>

      {/* Month Selection Dropdown */}
      <select
        onChange={(e) => setSelectedMonth(Number(e.target.value))}
        value={selectedMonth}
        style={styles.select}
      >
        {[
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ].map((month, index) => (
          <option key={index} value={index + 1}>
            {month}
          </option>
        ))}
      </select>
    </div>
  );
}

const styles = {
  container: {
    textAlign: "center",
    padding: "30px",
    backgroundColor: "#f4f7f6",
    fontFamily: "'Roboto', sans-serif",
  },
  header: {
    fontSize: "2.5rem",
    marginBottom: "20px",
    color: "#333",
    textAlign: "left", // Align header to the left
  },
  mainContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    maxWidth: "1200px",
    margin: "0 auto",
    position: "relative",
  },
  calendarContainer: {
    flex: 1,
    marginRight: "30px",
  },
  statsContainer: {
    flex: 0.35,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  statBox: {
    padding: "20px",
    borderRadius: "8px",
    margin: "10px 0",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    textAlign: "left",
  },
  calendar: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "15px",
    maxWidth: "1200px",
    margin: "auto",
  },
  dayStats: {
    marginTop: "20px",
  },
  dayCell: {
    padding: "5px 20px 5px 20px",
    borderRadius: "8px",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    transition: "all 0.3s ease-in-out",
    position: "relative", // To position inner elements absolutely
    display: "flex",
    flexDirection: "column", // Stack the content vertically
    justifyContent: "space-between", // Ensure space between top, center, and bottom
    height: "100%", // Full height of the day cell
  },
  dayHeader: {
    fontSize: "1.2rem",
    fontWeight: "bold",
    alignSelf: "flex-start", // Align the date to the top-left
  },
  dayView: {
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    maxWidth: "600px",
    margin: "20px auto",
  },
  closeButton: {
    fontSize: "20px",
    cursor: "pointer",
    border: "none",
    background: "none",
    color: "#333",
  },
  dayDetails: {
    marginTop: "20px",
    fontSize: "1.2rem",
  },
  tradeBox: {
    backgroundColor: "#e0f7fa",
    padding: "10px",
    margin: "5px 0",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
  },
  dayEntry: {
    marginBottom: "10px",
  },
  statsCard: {
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    marginBottom: "30px",
  },
  select: {
    margin: "0px 25px 0px 0px",
    padding: "10px",
    fontSize: "1rem",
    borderRadius: "5px",
    border: "1px solid #ddd",
  },
  plContainer: {
    textAlign: "center", // Center P/L in the middle
    flex: 1, // Allow the P/L container to take up the remaining space
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  totalTradesContainer: {
    textAlign: "center", // Center total trades at the bottom
    marginBottom: "10px",
  },
};
