import React from 'react';

interface TrainingCardProps {
  training: {
    id: string;
    name: string;
    trainer: string;
    time: string;        // np. 15:00
    endTime: string;     // np. 16:30
    dayLabel: string;    // np. "Wtorek"
    spots: string;
    alreadyBooked?: boolean;
  };
  onBook?: (id: string) => void;
}

const TrainingCard: React.FC<TrainingCardProps> = ({ training, onBook }) => {
  const noSpotsLeft = training.spots.startsWith('0/');

  return (
    <div
      style={{
        border: '1px solid #ccc',
        borderRadius: '8px',
        padding: '15px',
        minWidth: '250px',
      }}
    >
      <h3>{training.name}</h3>
      <p>Trener: {training.trainer}</p>
      <p>Dzień tygodnia: {training.dayLabel}</p>
      <p>Godzina rozpoczęcia: {training.time}</p>
      <p>Godzina zakończenia: {training.endTime}</p>
      <p>Dostępne miejsca: {training.spots}</p>

      {training.alreadyBooked ? (
        <p style={{ color: 'green', fontWeight: 'bold' }}>
          Jesteś już zapisany na te zajęcia. <br />
          <a href="/client">Zobacz w panelu klienta</a>
        </p>
      ) : noSpotsLeft ? (
        <p style={{ color: 'red', fontWeight: 'bold' }}>Brak dostępnych miejsc</p>
      ) : (
        onBook && <button onClick={() => onBook(training.id)}>Zapisz się</button>
      )}
    </div>
  );
};

export default TrainingCard;
