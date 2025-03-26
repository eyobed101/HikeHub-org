import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";
import Badge from "../../ui/badge/Badge";
import { Modal } from "../../ui/modal";
import Input from "../../form/input/InputField";
import Button from "../../ui/Button/Button";
import Label from "../../form/Label";
import Select from "../../form/Select";
import MultiSelect from "../../form/MultiSelect";
import Flatpickr from "react-flatpickr";
import { CalenderIcon } from "../../../icons";
import TextArea from "../../form/input/TextArea";
import { useDropzone } from "react-dropzone";
import ComponentCard from "../../common/ComponentCard";
import axiosInstance from "../../../utils/axiosInstance";
import { useTheme } from "../../../context/ThemeContext";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules"; // Import the required modules
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Spin } from "antd";

interface Event {
  _id: string;
  organizer: {
    username: string;
    phone_number: string;
  };
  title: string;
  location: string;
  distance: string;
  price: number;
  status: string;
  images: string[];
}

export default function EventTable({ tableData }: { tableData: Event[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>([]); // State for categories
  const [viewEvent, setViewEvent] = useState<Event | null>(null); // State to hold the event to view
  const [isViewModalOpen, setIsViewModalOpen] = useState(false); // State to control the view modal
  const [refersh, setRefresh] = useState(false); // State to control the view modal
  const [currentPage, setCurrentPage] = useState(1); // Current page for pagination
  const rowsPerPage = 6; // Number of rows per page
  const [searchQuery, setSearchQuery] = useState(""); // Search query for filtering
  const [filteredData, setFilteredData] = useState<Event[]>(tableData); // Filtered data
  const [loading, setLoading] = useState(false); // State to track loading

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    // Filter the table data based on the search query
    const filtered = tableData.filter(
      (event) =>
        event.title.toLowerCase().includes(query) ||
        event.location.toLowerCase().includes(query) ||
        event.status.toLowerCase().includes(query)
    );
    setFilteredData(filtered);
    setCurrentPage(1); // Reset to the first page after filtering
  };


  // Calculate the data to display on the current page
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredData.slice(indexOfFirstRow, indexOfLastRow);

  // Handle pagination
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const { theme } = useTheme(); // Get the current theme (e.g., "light" or "dark")
  const [formData, setFormData] = useState({
    _id: "",
    title: "",
    description: "",
    location: "",
    distance: "",
    itinerary: [],
    price: 0,
    maxParticipants: 0,
    startDate: "",
    endDate: "",
    transportation: "",
    weatherCondition: "",
    images: [],
    type: "",
    level: "",
    categories: "",
    meetingPlace: "",
    meetingTime: "",
    announcement: "",
  });


  useEffect(() => {

    const fetchCategories = async () => {
      try {
        const response = await axiosInstance.get("category"); // Replace with your actual endpoint
        if (response.status === 200) {
          setCategories(response.data); // Assuming the response contains the categories array
        } else {
          console.error("Failed to fetch categories:", response.data);
          toast.error("Failed to fetch categories. Please try again.");

        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast.error("An error occurred while fetching categories.");

      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchTableData = async () => {
      try {
        const response = await axiosInstance.get("event/organizer/all"); // Replace with your actual endpoint
        if (response.status === 200) {
          console.log("Table data fetched:", response.data);
          setFilteredData(response.data); // Update filtered data
        } else {
          console.error("Failed to fetch table data:", response.data);
          toast.error("Failed to fetch table data. Please try again.");
        }
      } catch (error) {
        console.error("Error fetching table data:", error);
        toast.error("An error occurred while fetching table data.");
      }
    };

    fetchTableData();
  }, [refersh]);

  const onDrop = (acceptedFiles: File[]) => {
    console.log("Files dropped:", acceptedFiles);

    if (acceptedFiles.length > 0) {
      // Create object URLs for preview and append files to the formData state
      const files = acceptedFiles.map((file) => ({
        path: URL.createObjectURL(file), // For preview
        file, // Keep the actual file for upload
      }));

      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...files],
      }));
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/png": [],
      "image/jpeg": [],
      "image/webp": [],
      "image/svg+xml": [],
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name: string, value: Date[]) => {
    setFormData((prev) => ({ ...prev, [name]: value[0] })); // Use the first selected date
  };

  const handleViewEvent = (event: Event) => {
    setViewEvent(event); // Set the selected event
    setIsViewModalOpen(true); // Open the view modal
  };

  const handleAddNewEvent = () => {
    setFormData({
      _id: "",  // Clear the form data
      title: "",
      description: "",
      location: "",
      distance: "",
      itinerary: [],
      price: 0,
      maxParticipants: 0,
      startDate: "",
      endDate: "",
      transportation: "",
      weatherCondition: "",
      images: [],
      type: "",
      level: "",
      categories: "",
      meetingPlace: "",
      meetingTime: "",
      announcement: "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSave = async () => {
    console.log("Form Data:", formData);

    const formDataToSend = new FormData();

    Object.keys(formData).forEach((key) => {
      if (key === "images") {
        // Append files for the "images" field
        formData.images.forEach((image) => {
          formDataToSend.append("images", image.file); // Append the actual file
        });
      } else {
        formDataToSend.append(key, formData[key]);
      }
    });

    setLoading(true); // Set loading to true


    try {
      if (formData._id) {
        // If the event has an ID, update the event
        const response = await axiosInstance.put(`event/details`, formData, {
          headers: {
            "eventid": formData._id,

          },
        });

        if (response.status === 200) {
          console.log("Event updated successfully:", response.data);
          setRefresh(!refersh); // Trigger refersh
          setIsModalOpen(false);

          toast.success("Event updated successfully!");
        } else {
          console.error("Failed to update event:", response.data);
          setIsModalOpen(false);

          toast.error("Failed to update event. Please try again.");
        }
      } else {
        // Otherwise, create a new event
        const response = await axiosInstance.post("event/create", formDataToSend,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        if (response.status === 201) {
          setRefresh(!refersh); // Trigger refersh

          console.log("Event created successfully:", response.data);
          setIsModalOpen(false);

          toast.success("Event created successfully!");
        } else {
          setIsModalOpen(false);

          console.error("Failed to create event:", response.data);
          toast.error("Failed to create event. Please try again.");
        }
      }
    } catch (error) {
      console.error("Error creating event:", error);
      toast.error("An error occurred while creating the event. Please try again.");
    } finally {
      setLoading(false); // Set loading to false
    }
  };

  const handleEditEvent = (event: Event) => {
    console.log(event);
    setFormData({
      _id: event._id,
      title: event.title,
      description: event.description || "",
      location: event.location,
      distance: event.distance,
      itinerary: event.itinerary || [],
      price: event.price,
      maxParticipants: event.maxParticipants || 0,
      startDate: event.startDate || "",
      endDate: event.endDate || "",
      transportation: event.transportation || "",
      weatherCondition: event.weatherCondition || "",
      images: event.multimedia || [],
      type: event.type || "",
      level: event.level || "",
      categories: event.categories || "",
      meetingPlace: event.meetingPlace || "",
      meetingTime: event.meetingTime || "",
      announcement: event.announcement || "",
    });
    setIsModalOpen(true); // Open the modal
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-800"></h2>
        <div className="flex gap-4">
          <Input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-64"
          />
          <Button
            onClick={() => handleAddNewEvent()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600"
          >
            Add New Event
          </Button>
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell className="px-5 py-3 font-medium text-gray-500 text-start">Event Title</TableCell>
                <TableCell className="px-5 py-3 font-medium text-gray-500 text-start">Location</TableCell>
                <TableCell className="px-5 py-3 font-medium text-gray-500 text-start">Distance</TableCell>
                <TableCell className="px-5 py-3 font-medium text-gray-500 text-start">Status</TableCell>
                <TableCell className="px-5 py-3 font-medium text-gray-500 text-start">Price</TableCell>
                <TableCell className="px-5 py-3 font-medium text-gray-500 text-start">Actions</TableCell>
              </TableRow>
            </TableHeader>


            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {currentRows.map((event) => (
                <TableRow key={event._id}>
                  <TableCell className="px-5 py-4 text-gray-800 dark:text-gray-400">
                    {event.title}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-blue-500 hover:underline">
                    {event.location}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-gray-800 dark:text-gray-400">
                    {event.distance}
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <Badge
                      size="sm"
                      color={
                        event.status === "Approved"
                          ? "success"
                          : event.status === "Pending"
                            ? "warning"
                            : "error"
                      }
                    >
                      {event.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-5 py-4 text-gray-800 dark:text-gray-400">
                    ${event.price.toFixed(2)}
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <div className="flex gap-2">
                      <button
                        className="text-blue-500 hover:underline"
                        onClick={() => handleViewEvent(event)}
                      >
                        View
                      </button>
                      <button
                        className="text-yellow-500 hover:underline"
                        onClick={() => handleEditEvent(event)} // Call the edit function
                      >
                        Edit
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <p className="text-sm text-gray-500">
          Showing {indexOfFirstRow + 1} to{" "}
          {Math.min(indexOfLastRow, filteredData.length)} of{" "}
          {filteredData.length} entries
        </p>
        <div className="flex gap-2">
          {Array.from({ length: totalPages }, (_, index) => (
            <button
              key={index}
              onClick={() => handlePageChange(index + 1)}
              className={`px-3 py-1 rounded-md ${currentPage === index + 1
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Modal for Adding New Event */}
      <Modal isOpen={isModalOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          {loading ? (
            <Spin size="large" className="flex justify-center items-center" />
          ) : (
            <>
              <div className="px-2 pr-14">
                <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                  {formData._id ? "Edit Event" : "Add New Event"}
                </h4>
                <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
                  {formData._id
                    ? "Update the details of the selected event."
                    : "Fill in the details to create a new event."}
                </p>
              </div>
              <form
                className="flex flex-col"
                onSubmit={(e) => {
                  e.preventDefault(); // Prevent the default form submission behavior
                  handleSave(); // Call the save function
                }}
              >
                <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
                  <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                    <div>
                      <Label>Title</Label>
                      <Input name="title" type="text" value={formData.title} onChange={handleInputChange} />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <TextArea
                        // value={message}
                        // onChange={(value) => setMessage(value)}
                        value={formData.description}
                        onChange={(value) => setFormData((prev) => ({ ...prev, description: value }))}
                        rows={6}
                      />
                    </div>
                    <div>
                      <Label>Location</Label>
                      <Input name="location" type="text" value={formData.location} onChange={handleInputChange} />
                      <Button
                        size="sm"
                        onClick={() => {
                          window.open("https://www.google.com/maps", "_blank");
                        }}
                        className="px-4 py-2 mt-2 mt-2text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600"
                      >
                        Open Google Maps
                      </Button>
                    </div>
                    <div>
                      <Label>Distance</Label>
                      <Input name="distance" type="text" value={formData.distance} onChange={handleInputChange} />
                    </div>
                    <div>
                      <Label>Price</Label>
                      <Input name="price" type="number" value={formData.price} onChange={handleInputChange} />
                    </div>
                    <div>
                      <Label>Max Participants</Label>
                      <Input
                        name="maxParticipants"
                        type="number"
                        value={formData.maxParticipants}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <Label>Start Date</Label>
                      <div className="relative w-full flatpickr-wrapper">
                        <Flatpickr
                          name="startDate"
                          value={formData.startDate} // Set the value to the state
                          onChange={(value) => handleDateChange("startDate", value)} // Use handleDateChange
                          options={{
                            dateFormat: "Y-m-d", // Set the date format
                          }}
                          placeholder="Select an option"
                          className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:focus:border-brand-800"
                        />
                        <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                          <CalenderIcon className="size-6" />
                        </span>
                      </div>
                    </div>
                    <div>
                      <Label>End Date</Label>
                      <div className="relative w-full flatpickr-wrapper">
                        <Flatpickr
                          name="endDate"
                          value={formData.endDate} // Set the value to the state
                          onChange={(value) => handleDateChange("endDate", value)} // Use handleDateChange
                          options={{
                            dateFormat: "Y-m-d", // Set the date format
                          }}
                          placeholder="Select an option"
                          className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:focus:border-brand-800"
                        />
                        <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                          <CalenderIcon className="size-6" />
                        </span>
                      </div>                </div>
                    <div>
                      <Label>Transportation</Label>
                      <Select
                        name="transportation"
                        value={formData.transportation}
                        onChange={(value) => handleSelectChange("transportation", value)}
                        options={[
                          { value: "Bus", label: "Bus" },
                          { value: "AirPlane", label: "AirPlane" },
                          { value: "Walk", label: "Walk" },
                        ]}
                        className="dark:bg-dark-900"


                      />
                    </div>
                    <div>
                      <Label>Type</Label>
                      <Select
                        name="type"
                        value={formData.type}
                        onChange={(value) => handleSelectChange("type", value)}
                        options={[
                          { value: "Camping", label: "Camping" },
                          { value: "Thru Hiking", label: "Thru Hiking" },
                          { value: "Backpacking", label: "Backpacking" },
                          { value: "Day", label: "Day" },
                        ]}
                        className="dark:bg-dark-900"
                      />
                    </div>
                    <div>
                      <Label>Difficalty Level</Label>
                      <Select
                        name="level"
                        value={formData.level}
                        onChange={(value) => handleSelectChange("level", value)}
                        options={[
                          { value: "Easy", label: "Easy" },
                          { value: "Intermediate", label: "Intermediate" },
                          { value: "Challenging", label: "Challenging" },
                          { value: "Difficult", label: "Difficult" },
                          { value: "Very Difficult", label: "Very Difficult" },
                        ]}
                        className="dark:bg-dark-900"
                      />
                    </div>
                    <div>
                      <Label>Hike Category</Label>
                      <Select
                        name="categories"
                        value={formData.categories}
                        onChange={(value) => handleSelectChange("categories", value)}
                        options={categories.map((category) => ({
                          value: category._id,
                          label: category.name,
                        }))}
                        className="dark:bg-dark-900"

                      />
                    </div>
                    <div>
                      <Label>Meeting Place</Label>
                      <Input name="meetingPlace" type="text" value={formData.meetingPlace} onChange={handleInputChange} />
                    </div>
                    <div>
                      <Label>Meeting Time</Label>
                      <Input name="meetingTime" type="text" value={formData.meetingTime} onChange={handleInputChange} />
                    </div>
                    <div>
                      <Label>Announcement</Label>
                      <Input name="announcement" type="text" value={formData.announcement} onChange={handleInputChange} />
                    </div>
                    <div>

                      <MultiSelect
                        label="Itinerary"
                        options={[
                          { value: "Campfire", text: "Campfire", selected: false },
                          { value: "Lunch and Dinner", text: "Lunch and Dinner", selected: false },
                          { value: "Sleeping Bag", text: "Sleeping Bag", selected: false },
                          { value: "Guided Hike", text: "Guided Hike", selected: false },
                          { value: "First Aid Support", text: "First Aid Support", selected: false },
                          { value: "Water Refill Station", text: "Water Refill Station", selected: false },
                          { value: "Trail Map and Compass", text: "Trail Map and Compass", selected: false },
                          { value: "Wildlife Awareness Briefing", text: "Wildlife Awareness Briefing", selected: false },
                          { value: "Emergency Contact Setup", text: "Emergency Contact Setup", selected: false },
                          { value: "Photography Session", text: "Photography Session", selected: false }
                        ]}
                        // defaultSelected={formData.itinerary}
                        defaultSelected={[]}
                        onChange={(selected) => {
                          setFormData((prev) => ({ ...prev, itinerary: selected }));
                        }}
                      />
                    </div>
                    <div>
                      <Label>Multimedia</Label>
                      <div className="transition border border-gray-300 border-dashed cursor-pointer dark:hover:border-brand-500 dark:border-gray-700 rounded-xl hover:border-brand-500">
                        <form
                          {...getRootProps()}
                          className={`dropzone rounded-xl   border-dashed border-gray-300 p-7 lg:p-10
                          ${isDragActive
                              ? "border-brand-500 bg-gray-100 dark:bg-gray-800"
                              : "border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900"
                            }
                `}
                          id="demo-upload"
                        >
                          {/* Hidden Input */}
                          <input {...getInputProps()} />

                          <div className="dz-message flex flex-col items-center m-0!">
                            {/* Icon Container */}
                            <div className="mb-[22px] flex justify-center">
                              <div className="flex h-[68px] w-[68px]  items-center justify-center rounded-full bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                                <svg
                                  className="fill-current"
                                  width="29"
                                  height="28"
                                  viewBox="0 0 29 28"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                    d="M14.5019 3.91699C14.2852 3.91699 14.0899 4.00891 13.953 4.15589L8.57363 9.53186C8.28065 9.82466 8.2805 10.2995 8.5733 10.5925C8.8661 10.8855 9.34097 10.8857 9.63396 10.5929L13.7519 6.47752V18.667C13.7519 19.0812 14.0877 19.417 14.5019 19.417C14.9161 19.417 15.2519 19.0812 15.2519 18.667V6.48234L19.3653 10.5929C19.6583 10.8857 20.1332 10.8855 20.426 10.5925C20.7188 10.2995 20.7186 9.82463 20.4256 9.53184L15.0838 4.19378C14.9463 4.02488 14.7367 3.91699 14.5019 3.91699ZM5.91626 18.667C5.91626 18.2528 5.58047 17.917 5.16626 17.917C4.75205 17.917 4.41626 18.2528 4.41626 18.667V21.8337C4.41626 23.0763 5.42362 24.0837 6.66626 24.0837H22.3339C23.5766 24.0837 24.5839 23.0763 24.5839 21.8337V18.667C24.5839 18.2528 24.2482 17.917 23.8339 17.917C23.4197 17.917 23.0839 18.2528 23.0839 18.667V21.8337C23.0839 22.2479 22.7482 22.5837 22.3339 22.5837H6.66626C6.25205 22.5837 5.91626 22.2479 5.91626 21.8337V18.667Z"
                                  />
                                </svg>
                              </div>
                            </div>

                            {/* Text Content */}
                            <h4 className="mb-3 font-semibold text-gray-800 text-theme-xl dark:text-white/90">
                              {isDragActive ? "Drop Files Here" : "Drag & Drop Files Here"}
                            </h4>

                            <span className=" text-center mb-5 block w-full max-w-[290px] text-sm text-gray-700 dark:text-gray-400">
                              Drag and drop your PNG, JPG, WebP, SVG images here or browse
                            </span>

                            <span className="font-medium underline text-theme-sm text-brand-500">
                              Browse File
                            </span>
                          </div>
                        </form>
                      </div>
                      {/* <Input name="multimedia" type="file" multiple onChange={handleImageUpload} /> */}
                    </div>
                    {formData.images.length > 0 && (
                      <ComponentCard title="Image Preview">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {formData.images.map((file, index) => (
                            <div key={index} className="relative">
                              <div className="overflow-hidden">
                                <img
                                  src={file.path || file} // Use `file.path` if it's an object, or `file` if it's a string
                                  alt={`Preview ${index + 1}`}
                                  className="w-full border border-gray-200 rounded-xl dark:border-gray-800"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </ComponentCard>
                    )}

                  </div>
                </div>

                <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                  <Button size="sm" variant="outline" onClick={closeModal}>
                    Close
                  </Button>
                  <Button size="sm" type="submit">
                    Save Event
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        className="max-w-[700px] m-4"
      >
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Event Details
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              View the details of the selected event.
            </p>
          </div>
          <div className="no-scrollbar custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
            {/* Carousel for Images */}
            {viewEvent?.multimedia && viewEvent.multimedia.length > 0 && (
              <div className="mb-6">
                <Swiper
                  modules={[Navigation, Pagination]}
                  navigation
                  pagination={{ clickable: true }}
                  className="rounded-xl overflow-hidden"
                >
                  {viewEvent.multimedia.map((image, index) => (
                    <SwiperSlide key={index}>
                      <img
                        src={image}
                        alt={`Event Image ${index + 1}`}
                        className="w-full h-64 object-cover border border-gray-200 rounded-xl dark:border-gray-800"
                      />
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
            )}

            {/* Event Details in Boxes */}
            {viewEvent && (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="p-4 border border-gray-200 rounded-lg dark:border-gray-700">
                  <Label>Title</Label>
                  <p className="text-gray-800 dark:text-white/90">{viewEvent.title}</p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg dark:border-gray-700">
                  <Label>Description</Label>
                  <p className="text-gray-800 dark:text-white/90">{viewEvent.description}</p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg dark:border-gray-700">
                  <Label>Location</Label>
                  <p className="text-gray-800 dark:text-white/90">{viewEvent.location}</p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg dark:border-gray-700">
                  <Label>Distance</Label>
                  <p className="text-gray-800 dark:text-white/90">{viewEvent.distance}</p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg dark:border-gray-700">
                  <Label>Price</Label>
                  <p className="text-gray-800 dark:text-white/90">${viewEvent.price.toFixed(2)}</p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg dark:border-gray-700">
                  <Label>Max Participants</Label>
                  <p className="text-gray-800 dark:text-white/90">{viewEvent.maxParticipants}</p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg dark:border-gray-700">
                  <Label>Booked Participants</Label>
                  <p className="text-gray-800 dark:text-white/90">
                    {viewEvent.bookedParticipants?.length || 0}
                  </p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg dark:border-gray-700">
                  <Label>Likes</Label>
                  <p className="text-gray-800 dark:text-white/90">{viewEvent.numberOfLikes || 0}</p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg dark:border-gray-700">
                  <Label>Views</Label>
                  <p className="text-gray-800 dark:text-white/90">{viewEvent.views || 0}</p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg dark:border-gray-700">
                  <Label>Start Date</Label>
                  <p className="text-gray-800 dark:text-white/90">{viewEvent.startDate}</p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg dark:border-gray-700">
                  <Label>End Date</Label>
                  <p className="text-gray-800 dark:text-white/90">{viewEvent.endDate}</p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg dark:border-gray-700">
                  <Label>Transportation</Label>
                  <p className="text-gray-800 dark:text-white/90">{viewEvent.transportation}</p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg dark:border-gray-700">
                  <Label>Weather Condition</Label>
                  <p className="text-gray-800 dark:text-white/90">{viewEvent.weatherCondition}</p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg dark:border-gray-700">
                  <Label>Type</Label>
                  <p className="text-gray-800 dark:text-white/90">{viewEvent.type}</p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg dark:border-gray-700">
                  <Label>Difficulty Level</Label>
                  <p className="text-gray-800 dark:text-white/90">{viewEvent.level}</p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg dark:border-gray-700">
                  <Label>Category</Label>
                  <p className="text-gray-800 dark:text-white/90">
                    {typeof viewEvent.categories === "object" && viewEvent.categories.name
                      ? viewEvent.categories.name
                      : viewEvent.categories}
                  </p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg dark:border-gray-700">
                  <Label>Meeting Place</Label>
                  <p className="text-gray-800 dark:text-white/90">{viewEvent.meetingPlace}</p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg dark:border-gray-700">
                  <Label>Meeting Time</Label>
                  <p className="text-gray-800 dark:text-white/90">{viewEvent.meetingTime}</p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg dark:border-gray-700">
                  <Label>Announcement</Label>
                  <p className="text-gray-800 dark:text-white/90">{viewEvent.announcement}</p>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
            <Button size="sm" variant="outline" onClick={() => setIsViewModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}