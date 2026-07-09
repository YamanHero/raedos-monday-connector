import express from "express";

const app = express();
app.use(express.json());
app.get("/", (req, res) => {
  res.json({ status: "ok", service: "RaedOS Monday connector" });
});

const MONDAY_API_TOKEN = process.env.MONDAY_API_TOKEN;
const BOARD_ID = process.env.MONDAY_BOARD_ID || "18408747466";
const GROUP_ID = process.env.MONDAY_GROUP_ID || "topics";

app.post("/raedos/task", async (req, res) => {
  try {
    const { title, priority = "High", step = "תקצוב", description = "" } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Missing title" });
    }

    const columnValues = {
      portfolio_project_rag: { label: "At risk" },
      portfolio_project_priority: { label: priority },
      portfolio_project_step: { label: step },
      portfolio_project_scope: description || title
    };

    const query = `
      mutation ($boardId: ID!, $groupId: String!, $itemName: String!, $columnValues: JSON!) {
        create_item(
          board_id: $boardId,
          group_id: $groupId,
          item_name: $itemName,
          column_values: $columnValues
        ) {
          id
        }
      }
    `;

    const response = await fetch("https://api.monday.com/v2", {
      method: "POST",
      headers: {
        "Authorization": MONDAY_API_TOKEN,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query,
        variables: {
          boardId: BOARD_ID,
          groupId: GROUP_ID,
          itemName: title,
          columnValues: JSON.stringify(columnValues)
        }
      })
    });

    const data = await response.json();

    if (data.errors) {
      return res.status(500).json({ error: data.errors });
    }

    res.json({
      success: true,
      monday_item_id: data.data.create_item.id
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("RaedOS Monday connector is running");
});
