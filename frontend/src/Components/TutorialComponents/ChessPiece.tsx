interface ChessPieceProps {
  piece: string;
  size?: 'sm' | 'md' | 'lg';
}

const ChessPiece: React.FC<ChessPieceProps> = ({ piece, size = 'lg' }) => {
  const pieceSymbols: { [key: string]: string } = {
    'white-king': '♔',
    'white-queen': '♕',
    'white-rook': '♖',
    'white-bishop': '♗',
    'white-knight': '♘',
    'white-pawn': '♙',
    'black-king': '♚',
    'black-queen': '♛',
    'black-rook': '♜',
    'black-bishop': '♝',
    'black-knight': '♞',
    'black-pawn': '♟',
  };

  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl',
  };

  return (
    <span className={`inline-block ${sizeClasses[size]}`}>
      {pieceSymbols[piece] || ''}
    </span>
  );
}

export default ChessPiece;
