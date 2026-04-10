import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import Calculator from "@/components/Calculator";

describe("Calculator Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Initial State", () => {
    it("renders calculator component", () => {
      render(<Calculator />);
      expect(screen.getByRole("button", { name: "+" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "-" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "×" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "÷" })).toBeInTheDocument();
    });
  });

  describe("Number Buttons", () => {
    it("renders all number buttons", () => {
      render(<Calculator />);
      expect(screen.getByRole("button", { name: "1" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "2" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "3" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "4" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "5" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "6" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "7" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "8" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "9" })).toBeInTheDocument();
    });
  });

  describe("Operation Buttons", () => {
    it("renders all operation buttons", () => {
      render(<Calculator />);
      expect(screen.getByRole("button", { name: "+" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "-" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "×" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "÷" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "=" })).toBeInTheDocument();
    });
  });

  describe("Utility Buttons", () => {
    it("renders utility buttons", () => {
      render(<Calculator />);
      expect(screen.getByRole("button", { name: "AC" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "+/-" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "%" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "." })).toBeInTheDocument();
    });
  });

  describe("onCalculate Callback", () => {
    it("does not call onCalculate when only number is entered", () => {
      const mockOnCalculate = jest.fn();
      render(<Calculator onCalculate={mockOnCalculate} />);
      
      fireEvent.click(screen.getByRole("button", { name: "5" }));
      expect(mockOnCalculate).not.toHaveBeenCalled();
    });
  });

  describe("Button Interactions", () => {
    it("can click multiple buttons without error", async () => {
      render(<Calculator />);
      
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "1" }));
        fireEvent.click(screen.getByRole("button", { name: "+" }));
        fireEvent.click(screen.getByRole("button", { name: "2" }));
        fireEvent.click(screen.getByRole("button", { name: "=" }));
      });
    });

    it("can click clear button", async () => {
      render(<Calculator />);
      
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "1" }));
        fireEvent.click(screen.getByRole("button", { name: "AC" }));
      });
    });
  });
});
