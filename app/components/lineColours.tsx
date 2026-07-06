export const lineColours = [
  { id: "T1", name: "North Shore & Western", color: "#F99D1C" },
  { id: "T2", name: "Leppington & Inner West", color: "#0098CD" },
  { id: "T3", name: "Liverpool & Inner West", color: "#F37021" },
  { id: "T4", name: "Eastern Suburbs & Illawarra", color: "#005AA3" },
  { id: "T5", name: "Cumberland", color: "#C4258F" },
  { id: "T6", name: "Lidcombe & Bankstown", color: "#7C3E21" },
  { id: "T7", name: "Olympic Park", color: "#6F818E" },
  { id: "T8", name: "Airport & South", color: "#00954C" },
  { id: "T9", name: "Northern", color: "#D11F2F" },
  { id: "APS", name: "Airport Services", color: "#00954C" },
  { id: "BMT", name: "Blue Mountains", color: "#F99D1C" },
  { id: "CCN", name: "Central Coast & Newcastle", color: "#D11F2F" },
  { id: "CMB", name: "Cumberland Service", color: "#C4258F" },
  { id: "CTY", name: "City Circle", color: "#F99D1C" },
  { id: "ESI", name: "Eastern Suburbs Services", color: "#005AA3" },
  { id: "IWL", name: "Inner West Line", color: "#0098CD" },
  { id: "NSN", name: "North Shore Northern", color: "#F99D1C" },
  { id: "NTH", name: "Northern Service", color: "#D11F2F" },
  { id: "OLY", name: "Olympic Park Shuttle", color: "#6F818E" },
  { id: "SCO", name: "South Coast", color: "#005AA3" },
  { id: "SHL", name: "Southern Highlands", color: "#00954C" },
  { id: "WST", name: "Southern Highlands", color: "#239993" },
];

export default function TrainLegend() {
  return (
    <div
      style={{
        position: "absolute",
        top: 10,
        right: 10,
        zIndex: 1000,
        background: "rgba(20,20,20,0.9)",
        color: "white",
        padding: "12px",
        borderRadius: "8px",
        minWidth: "240px",
        fontSize: "14px",
        maxHeight: "80vh",
        overflowY: "auto",
      }}
    >
      <h3 style={{ margin: "0 0 10px 0" }}>Train Lines</h3>

      {lineColours.map((line) => (
        <div
          key={line.id}
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "6px",
          }}
        >
          <div
            style={{
              width: "14px",
              height: "14px",
              backgroundColor: line.color,
              marginRight: "8px",
              borderRadius: "2px",
            }}
          />

          <strong style={{ width: "40px" }}>{line.id}</strong>

          <span>{line.name}</span>
        </div>
      ))}
    </div>
  );
}
