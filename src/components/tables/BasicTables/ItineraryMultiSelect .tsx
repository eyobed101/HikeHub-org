// Create a new component for ItineraryMultiSelect or modify your existing MultiSelect
import { useState } from "react";
import Badge from "../../ui/badge/Badge";
import Button from "../../ui/Button/Button";
import Input from "../../form/input/InputField";
import Label from "../../form/Label";

interface ItineraryItem {
    id: string;
    value: string;
    text: string;
    selected: boolean;
}

interface ItineraryMultiSelectProps {
    label: string;
    value?: string[];
    onChange: (selected: string[]) => void;
}

const ItineraryMultiSelect = ({ label, value = [], onChange }: ItineraryMultiSelectProps) => {
    const [items, setItems] = useState<ItineraryItem[]>([
        { id: "1", value: "Campfire", text: "Campfire", selected: false },
        { id: "2", value: "Lunch and Dinner", text: "Lunch and Dinner", selected: false },
        { id: "3", value: "Sleeping Bag", text: "Sleeping Bag", selected: false },
        { id: "4", value: "Guided Hike", text: "Guided Hike", selected: false },
        { id: "5", value: "First Aid Support", text: "First Aid Support", selected: false },
        { id: "6", value: "Water Refill Station", text: "Water Refill Station", selected: false },
        { id: "7", value: "Trail Map and Compass", text: "Trail Map and Compass", selected: false },
        { id: "8", value: "Wildlife Awareness Briefing", text: "Wildlife Awareness Briefing", selected: false },
        { id: "9", value: "Emergency Contact Setup", text: "Emergency Contact Setup", selected: false },
        { id: "10", value: "Photography Session", text: "Photography Session", selected: false }
    ]);

    const [newItem, setNewItem] = useState("");
    const [showCustomInput, setShowCustomInput] = useState(false);

    // Initialize selected items from props
    const initializeSelectedItems = () => {
        const updatedItems = items.map(item => ({
            ...item,
            selected: value.includes(item.value)
        }));
        setItems(updatedItems);
    };

    useState(() => {
        initializeSelectedItems();
    });

    const toggleItem = (itemId: string) => {
        const updatedItems = items.map(item => {
            if (item.id === itemId) {
                return { ...item, selected: !item.selected };
            }
            return item;
        });

        setItems(updatedItems);

        // Get selected values
        const selectedValues = updatedItems
            .filter(item => item.selected)
            .map(item => item.value);

        onChange(selectedValues);
    };

    const addCustomItem = () => {
        if (newItem.trim()) {
            const newItemObj = {
                id: `custom-${Date.now()}`,
                value: newItem.trim(),
                text: newItem.trim(),
                selected: true
            };

            const updatedItems = [...items, newItemObj];
            setItems(updatedItems);

            // Get selected values including the new item
            const selectedValues = updatedItems
                .filter(item => item.selected)
                .map(item => item.value);

            onChange(selectedValues);
            setNewItem("");
            setShowCustomInput(false);
        }
    };

    const removeItem = (itemId: string) => {
        const updatedItems = items.filter(item => item.id !== itemId);
        setItems(updatedItems);

        const selectedValues = updatedItems
            .filter(item => item.selected)
            .map(item => item.value);

        onChange(selectedValues);
    };

    return (
        <div className="space-y-3">
            <Label>{label}</Label>

            {/* Selected Items Display */}
            <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                    {items
                        .filter(item => item.selected)
                        .map(item => (
                            <Badge
                                key={item.id}
                                color="primary"
                                className="flex items-center gap-1 px-3 py-1.5"
                            >
                                <span>{item.text}</span>
                                <button
                                    type="button"
                                    onClick={() => toggleItem(item.id)}
                                    className="ml-1.5 text-xs hover:text-white"
                                >
                                    ×
                                </button>
                            </Badge>
                        ))}
                </div>

                {items.filter(item => item.selected).length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        No itinerary items selected
                    </p>
                )}
            </div>

            {/* Available Items */}
            <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                    {items
                        .filter(item => !item.selected)
                        .map(item => (
                            <button
                                type="button"
                                key={item.id}
                                onClick={() => toggleItem(item.id)}
                                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                {item.text}
                            </button>
                        ))}
                </div>
            </div>

            {/* Add Custom Item Section */}
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                {showCustomInput ? (
                    <div className="space-y-2">
                        <Input
                            type="text"
                            value={newItem}
                            onChange={(e) => setNewItem(e.target.value)}
                            placeholder="Enter custom itinerary item"
                            className="w-full"
                        />
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                size="sm"
                                onClick={addCustomItem}
                                className="px-3 py-1.5"
                            >
                                Add Item
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => setShowCustomInput(false)}
                                className="px-3 py-1.5"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                ) : (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCustomInput(true)}
                        className="flex items-center gap-2"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Add Custom Item
                    </Button>
                )}
            </div>
        </div>
    );
};

export default ItineraryMultiSelect;