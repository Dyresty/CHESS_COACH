interface Props {
  lastMoveSan?: string
  onDone: () => void
}

/** The blunder-check habit: three questions to answer before every move. */
export function SafetyCheck({ lastMoveSan, onDone }: Props) {
  return (
    <div className="safety">
      <p className="safety-title">Safety check before you move</p>
      <ol>
        <li>{lastMoveSan ? <>What does their last move, <b>{lastMoveSan}</b>, attack?</> : 'What is your opponent attacking?'}</li>
        <li>Can you take anything for free, or give check?</li>
        <li>Will the piece you move be safe on its new square?</li>
      </ol>
      <button className="primary" onClick={onDone}>
        I checked, let me move
      </button>
    </div>
  )
}
