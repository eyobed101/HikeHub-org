import { useEffect, useState, useCallback } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import axiosInstance from "../../utils/axiosInstance";
import { Spin, message, Alert, Select, Tag } from "antd";
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  ExclamationCircleOutlined 
} from "@ant-design/icons";


interface BankAccount {
  _id: string;
  bankTemplate: {
    _id: string;
    bankName: string;
    bankCode?: string;
    swiftCode?: string;
    accountTypes: string[];
  };
  firstname: string;
  lastname: string;
  accountNumber: string;
  accountHolderName: string;
  accountType: string;
  branchName?: string;
  swiftCode?: string;
  isDefault: boolean;
  isActive: boolean;
}

interface BankTemplate {
  _id: string;
  bankName: string;
  bankCode?: string;
  swiftCode?: string;
  accountTypes: string[];
  isActive: boolean;
}

interface ProfileCompletion {
  isComplete: boolean;
  requiredFields: {
    companyName: string | null;
    bankAccount: BankAccount | null;
    firstname: string | null;
    lastname: string | null;
  };
  missingFields: string[];
  message: string;
}

export default function UserMetaCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const { isOpen: isBankModalOpen, openModal: openBankModal, closeModal: closeBankModal } = useModal();
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
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [bankTemplates, setBankTemplates] = useState<BankTemplate[]>([]);
  const [profileCompletion, setProfileCompletion] = useState<ProfileCompletion | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [bankLoading, setBankLoading] = useState(false);
  
  // Bank account form state
  const [bankFormData, setBankFormData] = useState({
    bankTemplateId: "",
    firstname: "",
    lastname: "",
    accountNumber: "",
    accountHolderName: "",
    accountType: "Checking",
    branchName: "",
    swiftCode: "",
    isDefault: false,
  });
  const [editingBankAccount, setEditingBankAccount] = useState<BankAccount | null>(null);


  // Fetch bank templates
  const fetchBankTemplates = useCallback(async () => {
    try {
      const response = await axiosInstance.get("bank-accounts/templates") as any;
      if (response.data?.data) {
        setBankTemplates(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching bank templates:", error);
    }
  }, []);

  // Fetch bank accounts
  const fetchBankAccounts = useCallback(async () => {
    try {
      const response = await axiosInstance.get("bank-accounts") as any;
      if (response.data?.data) {
        setBankAccounts(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching bank accounts:", error);
    }
  }, []);

  // Fetch profile completion status
  const fetchProfileCompletion = useCallback(async () => {
    try {
      const response = await axiosInstance.get("bank-accounts/profile-completion") as any;
      setProfileCompletion(response.data as ProfileCompletion);
    } catch (error) {
      console.error("Error fetching profile completion:", error);
    }
  }, []);

  useEffect(() => {
    const fetchOrganizerDetails = async () => {
      try {
        setLoading(true);

        const [orgResponse, bankResponse, bankTemplatesResponse, completionResponse] = await Promise.all([
          axiosInstance.get("auth/organizer/detail") as any,
          (axiosInstance.get("bank-accounts").catch(() => ({ data: { data: [] } })) as any),
          (axiosInstance.get("bank-accounts/templates").catch(() => ({ data: { data: [] } })) as any),
          (axiosInstance.get("bank-accounts/profile-completion").catch(() => ({ data: {} })) as any)
        ]);

        const data = orgResponse.data as any;
        if (data) {
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
        }

        // Set bank accounts
        if (bankResponse.data?.data) {
          setBankAccounts(bankResponse.data.data);
        }

        // Set bank templates
        if (bankTemplatesResponse.data?.data) {
          setBankTemplates(bankTemplatesResponse.data.data);
        }

        // Set profile completion
        if (completionResponse.data) {
          setProfileCompletion(completionResponse.data as ProfileCompletion);
        }
      } catch (error) {
        console.error("Error fetching organizer details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizerDetails();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    closeModal();
    try {
      // Update organizer details
      const formData = new FormData();
      formData.append("phone_number", organizerDetails.phone_number);
      formData.append("city", organizerDetails.city);
      formData.append("address", organizerDetails.address);
      formData.append("companyDescription", organizerDetails.companyDescription);
      formData.append("tripsOrganizedBefore", organizerDetails.tripsOrganizedBefore.toString());
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

      message.success("Profile updated successfully!");
      
      // Refresh data
      await Promise.all([fetchBankAccounts(), fetchBankTemplates(), fetchProfileCompletion()]);
    } catch (error: any) {
      console.error("Error updating organizer details:", error);
      message.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  // Bank account handlers
  const handleCreateBankAccount = async () => {
    try {
      setBankLoading(true);
      await axiosInstance.post("bank-accounts", bankFormData);
      message.success("Bank account added successfully!");
      closeBankModal();
      resetBankForm();
      await Promise.all([fetchBankAccounts(), fetchBankTemplates(), fetchProfileCompletion()]);
    } catch (error: any) {
      message.error(error.response?.data?.message || "Failed to add bank account");
    } finally {
      setBankLoading(false);
    }
  };

  const handleUpdateBankAccount = async () => {
    if (!editingBankAccount) return;
    try {
      setBankLoading(true);
      await axiosInstance.put(`bank-accounts/${editingBankAccount._id}`, bankFormData);
      message.success("Bank account updated successfully!");
      closeBankModal();
      resetBankForm();
      await Promise.all([fetchBankAccounts(), fetchProfileCompletion()]);
    } catch (error: any) {
      message.error(error.response?.data?.message || "Failed to update bank account");
    } finally {
      setBankLoading(false);
    }
  };

  const handleDeleteBankAccount = async (accountId: string) => {
    try {
      await axiosInstance.delete(`bank-accounts/${accountId}`);
      message.success("Bank account deleted successfully!");
      await Promise.all([fetchBankAccounts(), fetchProfileCompletion()]);
    } catch (error: any) {
      message.error(error.response?.data?.message || "Failed to delete bank account");
    }
  };

  const handleEditBankAccount = (account: BankAccount) => {
    setEditingBankAccount(account);
    setBankFormData({
      bankTemplateId: account.bankTemplate._id,
      firstname: account.firstname,
      lastname: account.lastname,
      accountNumber: account.accountNumber,
      accountHolderName: account.accountHolderName,
      accountType: account.accountType,
      branchName: account.branchName || "",
      swiftCode: account.swiftCode || "",
      isDefault: account.isDefault,
    });
    openBankModal();
  };

  const resetBankForm = () => {
    setBankFormData({
      bankTemplateId: "",
      firstname: "",
      lastname: "",
      accountNumber: "",
      accountHolderName: "",
      accountType: "Checking",
      branchName: "",
      swiftCode: "",
      isDefault: false,
    });
    setEditingBankAccount(null);
  };

  const openAddBankAccountModal = () => {
    resetBankForm();
    openBankModal();
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLogoFile(e.target.files[0]);
    }
  };

  if (loading) {
    return <Spin size="large" className="flex justify-center items-center min-h-screen" />;
  }

  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative flex flex-col items-center w-full gap-6 xl:flex-row">
            <div className=" w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
              <img
                src={organizerDetails.logo ? `http://localhost:3030/uploads/${organizerDetails.logo}` : "/images/user/owner.jpg"}
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
              <div className="mt-2">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  Profile Completion: {profileCompletion?.isComplete ? (
                    <span className="text-green-600 dark:text-green-400 font-semibold">Complete ✓</span>
                  ) : (
                    <span className="text-orange-600 dark:text-orange-400 font-semibold">Incomplete</span>
                  )}
                </p>
                {profileCompletion && !profileCompletion.isComplete && profileCompletion.missingFields.length > 0 && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    Missing: {profileCompletion.missingFields.join(", ")}
                  </p>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
      {/* Profile Completion Alert */}
      {profileCompletion && !profileCompletion.isComplete && (
        <Alert
          message="Profile Incomplete"
          description={
            <div>
              <p className="mb-2">Please complete the following required fields to create events:</p>
              <ul className="list-disc list-inside space-y-1">
                {profileCompletion.missingFields.includes('companyName') && <li>Company Name</li>}
                {profileCompletion.missingFields.includes('bankAccount') && <li>At least one Bank Account</li>}
                {profileCompletion.missingFields.includes('firstname') && <li>First Name (in bank account)</li>}
                {profileCompletion.missingFields.includes('lastname') && <li>Last Name (in bank account)</li>}
              </ul>
            </div>
          }
          type="warning"
          icon={<ExclamationCircleOutlined />}
          showIcon
          className="mb-6"
          closable
        />
      )}

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            Organization Information
          </h4>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Company Name
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {organizerDetails.companyName || <span className="text-red-500 italic">Not set</span>}
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

      {/* Bank Accounts Section */}
      <div className="mt-6 p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Bank Accounts
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage your bank accounts for receiving payments
            </p>
          </div>
          <Button
            size="sm"
            onClick={openAddBankAccountModal}
            className="flex items-center gap-2"
          >
            <PlusOutlined />
            Add Bank Account
          </Button>
        </div>

        {bankAccounts.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400 mb-2">No bank accounts added</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
              Add at least one bank account to receive payments
            </p>
            <Button size="sm" onClick={openAddBankAccountModal}>
              <PlusOutlined />
              Add Your First Bank Account
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {bankAccounts.map((account) => (
              <div
                key={account._id}
                className="p-4 border border-gray-200 rounded-lg dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h5 className="font-semibold text-gray-800 dark:text-white/90">
                        {account.bankTemplate.bankName}
                      </h5>
                      {account.isDefault && (
                        <Tag color="blue" className="text-xs">Default</Tag>
                      )}
                    </div>
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Name:</span> {account.firstname} {account.lastname}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Account:</span> {account.accountNumber}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Holder:</span> {account.accountHolderName}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Type:</span> {account.accountType}
                      </p>
                      {account.branchName && (
                        <p className="text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Branch:</span> {account.branchName}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditBankAccount(account)}
                    >
                      <EditOutlined />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteBankAccount(account._id)}
                    >
                      <DeleteOutlined />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
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
            e.preventDefault();
            handleSave();
          }}>
            <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
              <div className="mt-7">
                <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                  Personal Information
                </h5>



                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  <div className="col-span-2">
                    <Label>Logo</Label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="w-full p-2 border border-gray-300 rounded-md dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                    />
                  </div>
                  <div className="col-span-2 lg:col-span-1">
                    <Label>Username</Label>
                    <Input
                      type="text"
                      value={organizerDetails.organizer.username}
                      disabled
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Email Address</Label>
                    <Input
                      type="text"
                      value={organizerDetails.organizer.email}
                      disabled
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
                    <Label>Company Name <span className="text-red-500">*</span></Label>
                    <Input
                      type="text"
                      value={organizerDetails.companyName}
                      onChange={(e) =>
                        setOrganizerDetails({
                          ...organizerDetails,
                          companyName: e.target.value,
                        })
                      }
                      placeholder="Enter your company name"
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
              <Button size="sm" onClick={handleSave}>
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Bank Account Modal */}
      <Modal isOpen={isBankModalOpen} onClose={closeBankModal} className="max-w-[600px] m-4">
        <div className="no-scrollbar relative w-full max-w-[600px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              {editingBankAccount ? "Edit Bank Account" : "Add Bank Account"}
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              {editingBankAccount 
                ? "Update your bank account details." 
                : "Add a bank account to receive payments from event bookings."}
            </p>
          </div>
          <form className="flex flex-col" onSubmit={(e) => {
            e.preventDefault();
            if (editingBankAccount) {
              handleUpdateBankAccount();
            } else {
              handleCreateBankAccount();
            }
          }}>
            <div className="custom-scrollbar max-h-[500px] overflow-y-auto px-2 pb-3">
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                <div className="col-span-2">
                  <Label>Bank <span className="text-red-500">*</span></Label>
                  <Select
                    value={bankFormData.bankTemplateId || undefined}
                    onChange={(value) => {
                      const selectedTemplate = bankTemplates.find(t => t._id === value);
                      setBankFormData({ 
                        ...bankFormData, 
                        bankTemplateId: value || "",
                        accountType: selectedTemplate?.accountTypes[0] || "Checking",
                        swiftCode: selectedTemplate?.swiftCode || ""
                      });
                    }}
                    placeholder="Search and select a bank..."
                    style={{ width: '100%' }}
                    size="large"
                    options={bankTemplates
                      .filter(template => template.isActive)
                      .map(template => ({
                        value: template._id,
                        label: template.bankName,
                        bankCode: template.bankCode,
                        swiftCode: template.swiftCode
                      }))}
                    disabled={!!editingBankAccount}
                    showSearch
                    allowClear
                    optionFilterProp="label"
                    filterOption={(input, option) => {
                      const searchText = input.toLowerCase();
                      const label = (option?.label ?? '').toLowerCase();
                      const bankCode = (option?.bankCode ?? '').toLowerCase();
                      const swiftCode = (option?.swiftCode ?? '').toLowerCase();
                      return label.includes(searchText) || 
                             bankCode.includes(searchText) || 
                             swiftCode.includes(searchText);
                    }}
                    notFoundContent={
                      bankTemplates.filter(t => t.isActive).length === 0 
                        ? "No active banks available" 
                        : "No banks found"
                    }
                    getPopupContainer={(trigger) => trigger.parentElement || document.body}
                    dropdownStyle={{ zIndex: 1050 }}
                  />
                  {bankFormData.bankTemplateId && (() => {
                    const selectedTemplate = bankTemplates.find(t => t._id === bankFormData.bankTemplateId);
                    return selectedTemplate ? (
                      <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                            {selectedTemplate.bankName}
                          </p>
                          {selectedTemplate.bankCode && (
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              <span className="font-medium">Bank Code:</span> {selectedTemplate.bankCode}
                            </p>
                          )}
                          {selectedTemplate.swiftCode && (
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              <span className="font-medium">SWIFT Code:</span> {selectedTemplate.swiftCode}
                            </p>
                          )}
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Available Account Types:</span> {selectedTemplate.accountTypes.join(", ")}
                          </p>
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>

                <div className="col-span-2 lg:col-span-1">
                  <Label>First Name <span className="text-red-500">*</span></Label>
                  <Input
                    type="text"
                    value={bankFormData.firstname}
                    onChange={(e) =>
                      setBankFormData({ ...bankFormData, firstname: e.target.value })
                    }
                    placeholder="Enter your first name"
                  />
                </div>

                <div className="col-span-2 lg:col-span-1">
                  <Label>Last Name <span className="text-red-500">*</span></Label>
                  <Input
                    type="text"
                    value={bankFormData.lastname}
                    onChange={(e) =>
                      setBankFormData({ ...bankFormData, lastname: e.target.value })
                    }
                    placeholder="Enter your last name"
                  />
                </div>

                <div className="col-span-2">
                  <Label>Account Number <span className="text-red-500">*</span></Label>
                  <Input
                    type="text"
                    value={bankFormData.accountNumber}
                    onChange={(e) =>
                      setBankFormData({ ...bankFormData, accountNumber: e.target.value })
                    }
                    placeholder="Enter account number"
                  />
                </div>

                <div className="col-span-2">
                  <Label>Account Holder Name <span className="text-red-500">*</span></Label>
                  <Input
                    type="text"
                    value={bankFormData.accountHolderName}
                    onChange={(e) =>
                      setBankFormData({ ...bankFormData, accountHolderName: e.target.value })
                    }
                    placeholder="Enter account holder name"
                  />
                </div>

                <div className="col-span-2 lg:col-span-1">
                  <Label>Account Type <span className="text-red-500">*</span></Label>
                  <Select
                    value={bankFormData.accountType}
                    onChange={(value) =>
                      setBankFormData({ ...bankFormData, accountType: value })
                    }
                    className="w-full"
                    disabled={!bankFormData.bankTemplateId}
                    options={
                      bankFormData.bankTemplateId
                        ? bankTemplates
                            .find(t => t._id === bankFormData.bankTemplateId)
                            ?.accountTypes.map(type => ({ value: type, label: type })) || []
                        : []
                    }
                  />
                </div>

                <div className="col-span-2 lg:col-span-1">
                  <Label>Branch Name</Label>
                  <Input
                    type="text"
                    value={bankFormData.branchName}
                    onChange={(e) =>
                      setBankFormData({ ...bankFormData, branchName: e.target.value })
                    }
                    placeholder="Optional"
                  />
                </div>

                <div className="col-span-2">
                  <Label>SWIFT Code</Label>
                  <Input
                    type="text"
                    value={bankFormData.swiftCode}
                    onChange={(e) =>
                      setBankFormData({ ...bankFormData, swiftCode: e.target.value })
                    }
                    placeholder={bankFormData.bankTemplateId && bankTemplates.find(t => t._id === bankFormData.bankTemplateId)?.swiftCode 
                      ? "Auto-filled from bank template (can be overridden)" 
                      : "Optional"}
                  />
                  {bankFormData.bankTemplateId && bankTemplates.find(t => t._id === bankFormData.bankTemplateId)?.swiftCode && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span className="text-green-600 dark:text-green-400">✓</span> Auto-filled from bank template. You can edit if needed.
                    </p>
                  )}
                </div>

                <div className="col-span-2">
                  <Label>
                    <input
                      type="checkbox"
                      checked={bankFormData.isDefault}
                      onChange={(e) =>
                        setBankFormData({ ...bankFormData, isDefault: e.target.checked })
                      }
                      className="mr-2"
                    />
                    Set as default account
                  </Label>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={() => { closeBankModal(); resetBankForm(); }}>
                Cancel
              </Button>
              <Button size="sm" disabled={bankLoading} onClick={() => {
                if (editingBankAccount) {
                  handleUpdateBankAccount();
                } else {
                  handleCreateBankAccount();
                }
              }}>
                {editingBankAccount ? "Update" : "Add"} Bank Account
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}