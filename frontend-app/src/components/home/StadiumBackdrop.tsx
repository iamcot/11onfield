// The fireflies canvas was removed (CoT, 2026-10-30): the floodlight beams are enough and the canvas cost frames.
export default function StadiumBackdrop() {
  return (
    <div className="of-bg" aria-hidden="true">
      <div className="of-bg-photo" />
      <div className="of-bg-light">
        <span className="of-src of-src--l" />
        <span className="of-src of-src--r" />
        <span className="of-beam of-beam--l">
          <i />
        </span>
        <span className="of-beam of-beam--r">
          <i />
        </span>
        <span className="of-beam of-beam--core of-beam--l">
          <i />
        </span>
        <span className="of-beam of-beam--core of-beam--r">
          <i />
        </span>
      </div>
      <div className="of-haze of-haze--a" />
      <div className="of-haze of-haze--b" />
      <div className="of-bg-shade" />
    </div>
  );
}
