import React, { Component } from "react";

class SendAdRequest extends Component {
  state = { winner: null, loading: false, error: null };

  sendRequest = async () => {
    this.setState({ loading: true, winner: null, error: null });

    try {
      const response = await fetch("http://localhost:3001/ad-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publisher_id: "123",
          ad_slot_id: "banner_top",
          geo: "US",
          device: "mobile",
          time: new Date().toISOString()
        })
      });

      if (response.status === 204) {
        this.setState({ error: "No eligible bids found.", loading: false });
      } else {
        const data = await response.json();
        this.setState({ winner: data, loading: false });
        this.props.refreshTable(); // To reload ad requests in Dashboard
      }
    } catch (err) {
      this.setState({ error: "Request failed.", loading: false });
    }
  };

  render() {
    const { winner, loading, error } = this.state;

    return (
      <div style={{ marginTop: "20px" }}>
        <button onClick={this.sendRequest} disabled={loading}>
          {loading ? "Sending..." : "Send Ad Request"}
        </button>
        {error && <p style={{ color: "red" }}>{error}</p>}
        {winner && (
          <div style={{ marginTop: "15px" }}>
            <h4>Winner: {winner.winner_dsp}</h4>
            <p>Bid: ${winner.bid_price}</p>
            <a href={winner.creative.click_url} target="_blank" rel="noreferrer">
              <img src={winner.creative.image_url} alt="Ad" width="300" />
            </a>
          </div>
        )}
      </div>
    );
  }
}

export default SendAdRequest;
