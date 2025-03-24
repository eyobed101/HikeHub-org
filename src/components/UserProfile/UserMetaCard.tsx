import { useEffect, useState } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import axiosInstance from "../../utils/axiosInstance";

export default function UserMetaCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const [organizerDetails, setOrganizerDetails] = useState({
    organizer: { username: "", email: "" },
    phone_number: "",
    city: "",
    address: "",
    bio: "",
    companyDescription: "",
    tripsOrganizedBefore: 0,
    RegistrationNumber: "",
    tinNo: "",
    heardAboutUs: "",
    companyName: "",
    logo: "",
    status: "",
  });
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchOrganizerDetails = async () => {
      try {
        const response = await axiosInstance.get("/auth/organizer/detail");
        const data = response.data; // Assuming the first object is the relevant one
        if (data) {
          console.log("Organizer details:", data);
          setOrganizerDetails({
            organizer: {
              username: data.organizer?.username || "",
              email: data.organizer?.email || "",
            },
            phone_number: data.phone_number || "",
            city: data.city || "",
            address: data.address || "",
            bio: data.companyDescription || "",
            tripsOrganizedBefore: data.tripsOrganizedBefore || 0,
            companyDescription: data.companyDescription || "",
            RegistrationNumber: data.RegistrationNumber || "",
            heardAboutUs: data.heardAboutUs || "",
            tinNo: data.tinNo || "",
            companyName: data.companyName || "",
            logo: data.logo || "",
            status: data.status || "",
          });
          calculateProfileCompletion(data);
        }
      } catch (error) {
        console.error("Error fetching organizer details:", error);
      }
    };

    const calculateProfileCompletion = (data: any) => {
      const totalFields = 9;
      const filledFields = [
        data.phone_number,
        data.city,
        data.address,
        String(data.tripsOrganizedBefore),
        data.companyDescription,
        data.RegistrationNumber,
        data.tinNo,
        data.companyName,
        data.logo,
      ].filter((field) => field && field.trim() !== "").length;

      setProfileCompletion(Math.round((filledFields / totalFields) * 100));
    };

    fetchOrganizerDetails();
  }, []);

  const handleSave = async () => {

    try {
      const formData = new FormData();
      formData.append("phone_number", organizerDetails.phone_number);
      formData.append("city", organizerDetails.city);
      formData.append("address", organizerDetails.address);
      formData.append("companyDescription", organizerDetails.companyDescription);
      formData.append("tripsOrganizedBefore", organizerDetails.tripsOrganizedBefore);
      formData.append("heardAboutUs", organizerDetails.heardAboutUs);
      formData.append("RegistrationNumber", organizerDetails.RegistrationNumber);
      formData.append("tinNo", organizerDetails.tinNo);
      formData.append("companyName", organizerDetails.companyName);
      if (logoFile) {
        formData.append("logo", logoFile);
      }

      await axiosInstance.put("auth/organizer", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Organizer details updated successfully!");
      closeModal();
    } catch (error) {
      console.error("Error updating organizer details:", error);
    }
    closeModal();
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLogoFile(e.target.files[0]);
    }
  };

  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative flex flex-col items-center w-full gap-6 xl:flex-row">
            <div className=" w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
              <img
                src={`https://hikeapi.issipeteta.net/uploads/${organizerDetails.logo}` || "/images/user/owner.jpg"}
                alt="user"
              />
              {organizerDetails.status === "Approved" && (
                <div className="absolute top-0 right-0 w-8 h-8 rounded-full flex items-center justify-center">
                  <img
                    src="verified.gif"
                    alt="Verified"
                    className="w-full h-full"
                  />
                </div>
              )}
            </div>
            <div className="order-3 xl:order-2">
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                {organizerDetails.companyName || "Trip Finder"}
              </h4>
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {organizerDetails.organizer.email || "N/A"}
                </p>
                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {organizerDetails.city || "N/A"}
                </p>
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Profile Completion: {profileCompletion}%
              </p>
            </div>

          </div>
        </div>
      </div>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            Organization Information
          </h4>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Company Name              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {organizerDetails.companyName}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Company Description
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {organizerDetails.companyDescription}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Business Registration Number              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {organizerDetails.RegistrationNumber}
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Tin Number
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {organizerDetails.tinNo}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Phone
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {organizerDetails.phone_number}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Address
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {organizerDetails.address}
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                City
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {organizerDetails.city}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={openModal}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
        >
          <svg
            className="fill-current"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
              fill=""
            />
          </svg>
          Edit
        </button>
      </div>
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Edit Personal Information
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Update your details to keep your profile up-to-date.
            </p>
          </div>
          <form className="flex flex-col" onSubmit={(e) => {
            e.preventDefault(); // Prevent the default form submission behavior
            handleSave(); // Call the save function
          }}>
            <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
              <div className="mt-7">
                <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                  Personal Information
                </h5>



                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  <div className="col-span-2">
                    <Label>Logo</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                    />
                  </div>
                  <div className="col-span-2 lg:col-span-1">
                    <Label>Username</Label>
                    <Input
                      type="text"
                      value={organizerDetails.organizer.username}
                      readOnly
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Email Address</Label>
                    <Input
                      type="text"
                      value={organizerDetails.organizer.email}
                      readOnly
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Phone</Label>
                    <Input
                      type="text"
                      value={organizerDetails.phone_number}
                      onChange={(e) =>
                        setOrganizerDetails({
                          ...organizerDetails,
                          phone_number: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>City</Label>
                    <Input
                      type="text"
                      value={organizerDetails.city}
                      onChange={(e) =>
                        setOrganizerDetails({
                          ...organizerDetails,
                          city: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="col-span-2">
                    <Label>Address</Label>
                    <Input
                      type="text"
                      value={organizerDetails.address}
                      onChange={(e) =>
                        setOrganizerDetails({
                          ...organizerDetails,
                          address: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="col-span-2">
                    <Label>Company Name</Label>
                    <Input
                      type="text"
                      value={organizerDetails.companyName}
                      onChange={(e) =>
                        setOrganizerDetails({
                          ...organizerDetails,
                          companyName: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="col-span-2">
                    <Label>Registration Number</Label>
                    <Input
                      type="text"
                      value={organizerDetails.RegistrationNumber}
                      onChange={(e) =>
                        setOrganizerDetails({
                          ...organizerDetails,
                          RegistrationNumber: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="col-span-2">
                    <Label>TIN Number</Label>
                    <Input
                      type="text"
                      value={organizerDetails.tinNo}
                      onChange={(e) =>
                        setOrganizerDetails({
                          ...organizerDetails,
                          tinNo: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="col-span-2">
                    <Label>Company Description</Label>
                    <Input
                      type="text"
                      value={organizerDetails.companyDescription}
                      onChange={(e) =>
                        setOrganizerDetails({
                          ...organizerDetails,
                          companyDescription: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Heard About Us</Label>
                    <select
                      className="w-full p-2 border border-gray-300 rounded-md dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                      value={organizerDetails.heardAboutUs}
                      onChange={(e) =>
                        setOrganizerDetails({
                          ...organizerDetails,
                          heardAboutUs: e.target.value,
                        })
                      }
                    >
                      <option value="">Select an option</option>
                      <option value="Facebook">Facebook</option>
                      <option value="TikTok">TikTok</option>
                      <option value="Instagram">Instagram</option>
                      <option value="Twitter">Twitter</option>
                      <option value="LinkedIn">LinkedIn</option>
                      <option value="YouTube">YouTube</option>
                      <option value="Friends">Friends</option>
                      <option value="Online Search">Online Search</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <Label>Trips Organized Before</Label>
                    <Input
                      type="number"
                      value={organizerDetails.tripsOrganizedBefore}
                      onChange={(e) =>
                        setOrganizerDetails({
                          ...organizerDetails,
                          tripsOrganizedBefore: parseInt(e.target.value, 10),
                        })
                      }
                    />
                  </div>



                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeModal}>
                Close
              </Button>
              <Button size="sm" type="submit">
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}