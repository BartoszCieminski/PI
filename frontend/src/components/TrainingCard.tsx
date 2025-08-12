import React from 'react';

interface Training {
  id: string; // UUID z bazy
  name: string;
  trainer: string;
  time: string;
}

interface TrainingCardProps {
  training: Training;
  onBook: (id: string) => void; // <- zmienione na string
}

const TrainingCard: React.FC<TrainingCardProps> = ({ training, onBook }) => {
  return (
    <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '10px', width: '200px' }}>
      <h4>{training.name}</h4>
      <p>Trener: {training.trainer}</p>
      <p>Godzina: {training.time}</p>
      <button onClick={() => onBook(training.id)}>Zapisz się</button>
    </div>
  );
};

export default TrainingCard;
