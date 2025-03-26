import React, { useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Label from "../form/Label"; // Reusable Label component
import Button from "../ui/Button/Button"; // Reusable Button component
import Input from "../form/input/InputField"; // Reusable Input component

export default function ManageParticipants({ events, allUsers }: { events: Event[]; allUsers: User[] }) {
  const [selectedEventId, setSelectedEventId] = useState<string>(""); // Selected event ID
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]); // Selected user IDs for adding/removing
  const [searchQuery, setSearchQuery] = useState<string>(""); // Search query for filtering users
  const [loading, setLoading] = useState(false); // Loading state for API requests

  // Get the booked participants for the selected event
  const bookedParticipants =
    events.find((event) => event._id === selectedEventId)?.bookedParticipants || [];

  // Filter users based on the search query
  const filteredUsers = allUsers
    .filter((user) => user.username.toLowerCase().includes(searchQuery.toLowerCase()))
    .slice(0, 10); // Show only the top 10 users

  // Handle checkbox toggle
  const handleCheckboxChange = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  // Handle add or remove participants
  const handleManageParticipants = async (action: "add" | "remove") => {
    if (!selectedEventId) {
      toast.error("Please select an event.");
      return;
    }

    if (selectedUsers.length === 0) {
      toast.error("Please select at least one user.");
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.post(
        "events/manageParticipants",
        { userIds: selectedUsers, action },
        {
          headers: {
            eventid: selectedEventId, // Pass the event ID in headers
          },
        }
      );

      if (response.status === 200) {
        toast.success(
          action === "add"
            ? "Users added to participants successfully!"
            : "Users removed from participants successfully!"
        );
        setSelectedUsers([]); // Clear selected users
      } else {
        toast.error("Failed to manage participants. Please try again.");
      }
    } catch (error) {
      console.error("Error managing participants:", error);
      toast.error("An error occurred while managing participants.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-white dark:border-gray-800 dark:bg-gray-900">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
        Manage Participants
      </h3>
      <div className="mb-4">
        <Label htmlFor="event-select">Select Event</Label>
        <select
          id="event-select"
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        >
          <option value="">Select an event</option>
          {events.map((event) => (
            <option key={event._id} value={event._id}>
              {event.title}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-4">
        <Label htmlFor="search-users">Search Users</Label>
        <Input
          id="search-users"
          type="text"
          placeholder="Search users by username..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <div className="mb-4">
        <Label>Select Participants</Label>
        <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-lg p-4 dark:border-gray-700 dark:bg-gray-800">
          {filteredUsers.map((user) => (
            <div key={user._id} className="flex items-center gap-3 mb-2">
              <input
                type="checkbox"
                checked={selectedUsers.includes(user._id)}
                onChange={() => handleCheckboxChange(user._id)}
                className="form-checkbox h-5 w-5 text-blue-600"
              />
              <span className="text-gray-800 dark:text-white">{user.username}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-4">
        <Button
          onClick={() => handleManageParticipants("add")}
          disabled={loading}
          className="bg-green-500 hover:bg-green-600"
        >
          {loading && selectedUsers.length > 0 ? "Adding..." : "Add Participants"}
        </Button>
        <Button
          onClick={() => handleManageParticipants("remove")}
          disabled={loading}
          className="bg-red-500 hover:bg-red-600"
        >
          {loading && selectedUsers.length > 0 ? "Removing..." : "Remove Participants"}
        </Button>
      </div>
    </div>
  );
}