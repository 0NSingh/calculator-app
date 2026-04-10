import React from "react";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import Sidebar from "@/components/Sidebar";

describe("Sidebar Component", () => {
  const defaultProps = {
    sessions: [
      { id: "1", name: "Session 1" },
      { id: "2", name: "Session 2" },
    ],
    history: [
      { id: "h1", calculation: "2 + 2", result: "4" },
      { id: "h2", calculation: "5 * 3", result: "15" },
    ],
    currentSessionId: "1",
    onSessionSelect: jest.fn(),
    onNewSession: jest.fn(),
    onDeleteSession: jest.fn(),
    onDeleteHistory: jest.fn(),
    onRenameSession: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders the sidebar with title", () => {
      render(<Sidebar {...defaultProps} />);
      expect(screen.getByText("Calculator")).toBeInTheDocument();
    });

    it("renders sessions in the list", () => {
      render(<Sidebar {...defaultProps} />);
      expect(screen.getByText("Session 1")).toBeInTheDocument();
      expect(screen.getByText("Session 2")).toBeInTheDocument();
    });

    it("shows correct session count", () => {
      render(<Sidebar {...defaultProps} />);
      expect(screen.getByText(/Sessions \(2\)/)).toBeInTheDocument();
    });

    it("shows correct history count", () => {
      render(<Sidebar {...defaultProps} />);
      expect(screen.getByText(/History \(2\)/)).toBeInTheDocument();
    });
  });

  describe("Tabs", () => {
    it("switches to history tab when clicked", async () => {
      render(<Sidebar {...defaultProps} />);
      await act(async () => {
        fireEvent.click(screen.getByText(/History \(2\)/));
      });
      expect(screen.getByText("2 + 2")).toBeInTheDocument();
    });

    it("switches back to sessions tab", async () => {
      render(<Sidebar {...defaultProps} />);
      await act(async () => {
        fireEvent.click(screen.getByText(/History \(2\)/));
        fireEvent.click(screen.getByText(/Sessions \(2\)/));
      });
      expect(screen.getByText("Session 1")).toBeInTheDocument();
    });
  });

  describe("History Items", () => {
    it("displays calculation expression in history tab", async () => {
      render(<Sidebar {...defaultProps} />);
      await act(async () => {
        fireEvent.click(screen.getByText(/History \(2\)/));
      });
      expect(screen.getByText("2 + 2")).toBeInTheDocument();
    });

    it("displays calculation result", async () => {
      render(<Sidebar {...defaultProps} />);
      await act(async () => {
        fireEvent.click(screen.getByText(/History \(2\)/));
      });
      const resultElements = screen.getAllByText(/= 4/);
      expect(resultElements.length).toBeGreaterThan(0);
    });

    it("shows empty state when no history", async () => {
      render(<Sidebar {...defaultProps} history={[]} />);
      await act(async () => {
        fireEvent.click(screen.getByText(/History \(0\)/));
      });
      expect(screen.getByText("No history yet")).toBeInTheDocument();
    });

    it("calls onHistoryItemClick when history item is clicked", async () => {
      const onHistoryItemClick = jest.fn();
      render(
        <Sidebar
          {...defaultProps}
          onHistoryItemClick={onHistoryItemClick}
        />
      );
      await act(async () => {
        fireEvent.click(screen.getByText(/History \(2\)/));
      });
      const historyButtons = screen.getAllByText(/= 4/);
      await act(async () => {
        fireEvent.click(historyButtons[0]);
      });
      expect(onHistoryItemClick).toHaveBeenCalledWith("4");
    });
  });

  describe("Session Selection", () => {
    it("calls onSessionSelect when session is clicked", async () => {
      render(<Sidebar {...defaultProps} />);
      await act(async () => {
        fireEvent.click(screen.getByText("Session 2"));
      });
      expect(defaultProps.onSessionSelect).toHaveBeenCalledWith("2");
    });
  });

  describe("New Session", () => {
    it("calls onNewSession when new button is clicked", async () => {
      render(<Sidebar {...defaultProps} />);
      await act(async () => {
        fireEvent.click(screen.getByTitle("New session"));
      });
      expect(defaultProps.onNewSession).toHaveBeenCalled();
    });
  });

  describe("Session Rename", () => {
    it("opens rename input when rename button is clicked", async () => {
      render(<Sidebar {...defaultProps} />);
      const renameButtons = screen.getAllByTitle("Rename");
      await act(async () => {
        fireEvent.click(renameButtons[0]);
      });
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("calls onRenameSession when Enter is pressed", async () => {
      render(<Sidebar {...defaultProps} />);
      const renameButtons = screen.getAllByTitle("Rename");
      await act(async () => {
        fireEvent.click(renameButtons[0]);
      });
      const input = screen.getByRole("textbox");
      await act(async () => {
        fireEvent.change(input, { target: { value: "New Name" } });
        fireEvent.keyDown(input, { key: "Enter" });
      });
      expect(defaultProps.onRenameSession).toHaveBeenCalledWith("1", "New Name");
    });

    it("closes rename input on Escape", async () => {
      render(<Sidebar {...defaultProps} />);
      const renameButtons = screen.getAllByTitle("Rename");
      await act(async () => {
        fireEvent.click(renameButtons[0]);
      });
      const input = screen.getByRole("textbox");
      await act(async () => {
        fireEvent.keyDown(input, { key: "Escape" });
      });
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    });
  });

  describe("Session Delete", () => {
    it("hides delete button for single session", () => {
      render(
        <Sidebar
          {...defaultProps}
          sessions={[{ id: "1", name: "Only Session" }]}
        />
      );
      expect(screen.queryByTitle("Delete")).not.toBeInTheDocument();
    });

    it("shows delete button when multiple sessions exist", () => {
      render(<Sidebar {...defaultProps} />);
      expect(screen.getAllByTitle("Delete").length).toBeGreaterThan(0);
    });

    it("calls onDeleteSession when delete is clicked", async () => {
      render(<Sidebar {...defaultProps} />);
      const deleteButtons = screen.getAllByTitle("Delete");
      await act(async () => {
        fireEvent.click(deleteButtons[0]);
      });
      expect(defaultProps.onDeleteSession).toHaveBeenCalled();
    });
  });

  describe("History Delete", () => {
    it("calls onDeleteHistory when delete is clicked", async () => {
      render(<Sidebar {...defaultProps} />);
      await act(async () => {
        fireEvent.click(screen.getByText(/History \(2\)/));
      });
      const deleteButtons = screen.getAllByTitle("Delete");
      await act(async () => {
        fireEvent.click(deleteButtons[0]);
      });
      expect(defaultProps.onDeleteHistory).toHaveBeenCalled();
    });
  });

  describe("Sidebar Collapse", () => {
    it("renders collapsed sidebar when isCollapsed is true", () => {
      render(<Sidebar {...defaultProps} isCollapsed={true} />);
      expect(screen.getByTitle("Expand sidebar")).toBeInTheDocument();
    });

    it("renders expanded sidebar when isCollapsed is false", () => {
      render(<Sidebar {...defaultProps} isCollapsed={false} />);
      expect(screen.getByTitle("Collapse sidebar")).toBeInTheDocument();
    });

    it("calls onToggleCollapse when collapse button is clicked", async () => {
      const onToggleCollapse = jest.fn();
      render(
        <Sidebar {...defaultProps} onToggleCollapse={onToggleCollapse} />
      );
      await act(async () => {
        fireEvent.click(screen.getByTitle("Collapse sidebar"));
      });
      expect(onToggleCollapse).toHaveBeenCalled();
    });
  });

  describe("Session Counter Footer", () => {
    it("shows correct session and calculation counts", () => {
      render(<Sidebar {...defaultProps} />);
      expect(screen.getByText(/2 sessions/)).toBeInTheDocument();
      expect(screen.getByText(/2 calculations/)).toBeInTheDocument();
    });

    it("uses singular form for single item", () => {
      render(
        <Sidebar
          {...defaultProps}
          sessions={[{ id: "1", name: "Session 1" }]}
          history={[{ id: "h1", calculation: "2 + 2", result: "4" }]}
        />
      );
      expect(screen.getByText(/1 session/)).toBeInTheDocument();
      expect(screen.getByText(/1 calculation/)).toBeInTheDocument();
    });
  });
});
