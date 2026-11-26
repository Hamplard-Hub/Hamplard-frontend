import type { Meta, StoryObj } from "@storybook/react";
import { Tab, TabList, TabPanel, Tabs } from "./Tabs";

const meta = {
  title: "UI/Tabs",
  component: Tabs,
  tags: ["autodocs"],
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CourseDetails: Story = {
  args: {
    defaultValue: "overview",
  },
  render: (args) => (
    <Tabs {...args} className="w-full max-w-xl">
      <TabList aria-label="Course details">
        <Tab value="overview">Overview</Tab>
        <Tab value="curriculum">Curriculum</Tab>
        <Tab value="reviews">Reviews</Tab>
      </TabList>
      <TabPanel value="overview" className="p-4">
        Learn the essential concepts and build a practical project.
      </TabPanel>
      <TabPanel value="curriculum" className="p-4">
        12 lessons covering the full course curriculum.
      </TabPanel>
      <TabPanel value="reviews" className="p-4">
        See what other students thought about this course.
      </TabPanel>
    </Tabs>
  ),
};

export const WithDisabledTab: Story = {
  args: {
    defaultValue: "available",
  },
  render: (args) => (
    <Tabs {...args}>
      <TabList aria-label="Account sections">
        <Tab value="available">Available</Tab>
        <Tab value="locked" disabled>
          Locked
        </Tab>
      </TabList>
      <TabPanel value="available" className="p-4">
        Available account settings.
      </TabPanel>
      <TabPanel value="locked" className="p-4">
        This content is unavailable.
      </TabPanel>
    </Tabs>
  ),
};

export const Vertical: Story = {
  args: {
    defaultValue: "profile",
    orientation: "vertical",
  },
  render: (args) => (
    <Tabs {...args} className="w-full max-w-xl flex-row">
      <TabList aria-label="Settings">
        <Tab value="profile">Profile</Tab>
        <Tab value="notifications">Notifications</Tab>
      </TabList>
      <TabPanel value="profile" className="p-4">
        Manage your profile details.
      </TabPanel>
      <TabPanel value="notifications" className="p-4">
        Manage notification preferences.
      </TabPanel>
    </Tabs>
  ),
};
