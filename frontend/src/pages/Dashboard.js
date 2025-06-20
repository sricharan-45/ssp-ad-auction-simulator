import React, { Component } from "react";
import SendAdRequest from "../components/SendAdRequest";

class Dashboard extends Component {
  state = { adRequests: [] };

  componentDidMount() {
    this.fetchAdRequests();
  }

  fetchAdRequests = () => {
    fetch("http://localhost:3001/admin/ad-requests")
      .then(res => res.json())
      .then(data => this.setState({ adRequests: data }))
      .catch(err => console.error("Error:", err));
  };

  render() {
    const { adRequests } = this.state;

    return (
      <div style={{ padding: "20px" }}>
        <h2>SSP Admin Dashboard</h2>
        <SendAdRequest refreshTable={this.fetchAdRequests} />
        <h3>Ad Request History</h3>
        <table border="1" cellPadding="5">
          <thead>
            <tr>
              <th>ID</th><th>Geo</th><th>Device</th><th>Winner DSP</th><th>Bid</th><th>Time</th>
            </tr>
          </thead>
          <tbody>
            {adRequests.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.geo}</td>
                <td>{r.device}</td>
                <td>{r.winner_dsp_id || "-"}</td>
                <td>{r.winning_bid_price || "-"}</td>
                <td>{new Date(r.request_time).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}

export default Dashboard;
