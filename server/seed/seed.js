import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';

// Import Models
import Employee from '../models/Employee.js';
import Department from '../models/Department.js';
import Team from '../models/Team.js';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import Leave from '../models/Leave.js';
import Announcement from '../models/Announcement.js';
import Document from '../models/Document.js';
import Notification from '../models/Notification.js';
import ActivityLog from '../models/ActivityLog.js';

dotenv.config();

const seedData = async () => {
  try {
    // Keep existing admin if any
    let admin = await Employee.findOne({ role: 'Admin' });
    if (!admin) {
      admin = new Employee({
        name: 'System Admin',
        email: 'admin@worksphere.com',
        phone: '+1 (555) 019-0000',
        designation: 'System Administrator',
        joiningDate: new Date(),
        address: 'WorkSphere Headquarters',
        password: 'Admin@123',
        role: 'Admin',
        status: 'Active'
      });
      await admin.save();
      console.log('Seeded new System Admin.');
    } else {
      console.log('Admin account already exists. Preserving existing Admin.');
    }

    // Clear all other data to prepare for seed
    const mockEmails = [
      'sarah.jenkins@worksphere.com', 'david.chen@worksphere.com', 'elena.rostova@worksphere.com',
      'marcus.sterling@worksphere.com', 'aisha.rahman@worksphere.com', 'alex.mercer@worksphere.com',
      'chloe.fraser@worksphere.com', 'ethan.hunt@worksphere.com', 'devon.lane@worksphere.com',
      'zoe.washburne@worksphere.com', 'bessie.cooper@worksphere.com', 'cody.fisher@worksphere.com',
      'dianne.russell@worksphere.com', 'esther.howard@worksphere.com', 'guy.hawkins@worksphere.com',
      'jenny.wilson@worksphere.com', 'kristin.watson@worksphere.com', 'albert.flores@worksphere.com',
      'floyd.miles@worksphere.com', 'courtney.henry@worksphere.com'
    ];
    await Employee.deleteMany({ $or: [{ role: { $ne: 'Admin' } }, { email: { $in: mockEmails } }] });
    await Department.deleteMany({});
    await Team.deleteMany({});
    await Project.deleteMany({});
    await Task.deleteMany({});
    await Leave.deleteMany({});
    await Announcement.deleteMany({});
    await Document.deleteMany({});
    await Notification.deleteMany({});
    await ActivityLog.deleteMany({});
    console.log('Cleaned non-admin database records.');

    // 2. Generate Departments (5)
    const departmentsData = [
      { name: 'Engineering', code: 'ENG', description: 'Core product engineering and development division', budget: 1200000 },
      { name: 'Product Management', code: 'PRD', description: 'Product strategy, roadmap, and user research', budget: 450000 },
      { name: 'Design', code: 'DSN', description: 'UI/UX design, visual design, and brand identity', budget: 350000 },
      { name: 'Human Resources', code: 'HR', description: 'Talent acquisition, operations, and employee experience', budget: 200000 },
      { name: 'Marketing', code: 'MKT', description: 'Growth marketing, brand communications, and partnerships', budget: 500000 }
    ];

    const departments = await Department.insertMany(departmentsData);
    console.log(`Created ${departments.length} departments.`);

    // 3. Generate Employees (20)
    // We'll define designations matching departments
    const designations = {
      ENG: ['VP of Engineering', 'Director of Engineering', 'Principal Engineer', 'Senior Software Engineer', 'Software Engineer', 'QA Engineer'],
      PRD: ['Director of Product', 'Senior Product Manager', 'Product Manager', 'Associate Product Manager'],
      DSN: ['Head of Design', 'Principal Designer', 'Senior UI/UX Designer', 'UI/UX Designer'],
      HR: ['HR Director', 'Senior HR Manager', 'HR Generalist'],
      MKT: ['VP of Marketing', 'Marketing Director', 'Content Strategist', 'Growth Specialist']
    };

    const employeesRaw = [
      // Leaders
      { name: 'Sarah Jenkins', email: 'sarah.jenkins@worksphere.com', phone: '+1 (555) 019-2834', code: 'HR', designation: 'HR Director' },
      { name: 'David Chen', email: 'david.chen@worksphere.com', phone: '+1 (555) 012-9843', code: 'ENG', designation: 'VP of Engineering' },
      { name: 'Elena Rostova', email: 'elena.rostova@worksphere.com', phone: '+1 (555) 014-4321', code: 'PRD', designation: 'Director of Product' },
      { name: 'Marcus Sterling', email: 'marcus.sterling@worksphere.com', phone: '+1 (555) 017-8976', code: 'DSN', designation: 'Head of Design' },
      { name: 'Aisha Rahman', email: 'aisha.rahman@worksphere.com', phone: '+1 (555) 018-3298', code: 'MKT', designation: 'VP of Marketing' },
      
      // Engineering
      { name: 'Alex Mercer', email: 'alex.mercer@worksphere.com', phone: '+1 (555) 011-2311', code: 'ENG', designation: 'Principal Engineer' },
      { name: 'Chloe Fraser', email: 'chloe.fraser@worksphere.com', phone: '+1 (555) 013-4322', code: 'ENG', designation: 'Senior Software Engineer' },
      { name: 'Ethan Hunt', email: 'ethan.hunt@worksphere.com', phone: '+1 (555) 015-7654', code: 'ENG', designation: 'Senior Software Engineer' },
      { name: 'Devon Lane', email: 'devon.lane@worksphere.com', phone: '+1 (555) 016-1234', code: 'ENG', designation: 'Software Engineer' },
      { name: 'Zoe Washburne', email: 'zoe.washburne@worksphere.com', phone: '+1 (555) 017-2345', code: 'ENG', designation: 'Software Engineer' },
      { name: 'Bessie Cooper', email: 'bessie.cooper@worksphere.com', phone: '+1 (555) 018-9876', code: 'ENG', designation: 'QA Engineer' },
      
      // Product
      { name: 'Cody Fisher', email: 'cody.fisher@worksphere.com', phone: '+1 (555) 019-3456', code: 'PRD', designation: 'Senior Product Manager' },
      { name: 'Dianne Russell', email: 'dianne.russell@worksphere.com', phone: '+1 (555) 010-4567', code: 'PRD', designation: 'Product Manager' },
      
      // Design
      { name: 'Esther Howard', email: 'esther.howard@worksphere.com', phone: '+1 (555) 011-5678', code: 'DSN', designation: 'Principal Designer' },
      { name: 'Guy Hawkins', email: 'guy.hawkins@worksphere.com', phone: '+1 (555) 012-6789', code: 'DSN', designation: 'Senior UI/UX Designer' },
      { name: 'Jenny Wilson', email: 'jenny.wilson@worksphere.com', phone: '+1 (555) 013-7890', code: 'DSN', designation: 'UI/UX Designer' },
      
      // Marketing
      { name: 'Kristin Watson', email: 'kristin.watson@worksphere.com', phone: '+1 (555) 014-8901', code: 'MKT', designation: 'Marketing Director' },
      { name: 'Albert Flores', email: 'albert.flores@worksphere.com', phone: '+1 (555) 015-9012', code: 'MKT', designation: 'Content Strategist' },
      
      // HR
      { name: 'Floyd Miles', email: 'floyd.miles@worksphere.com', phone: '+1 (555) 016-0123', code: 'HR', designation: 'Senior HR Manager' },
      { name: 'Courtney Henry', email: 'courtney.henry@worksphere.com', phone: '+1 (555) 017-0134', code: 'HR', designation: 'HR Generalist' }
    ];

    const employees = [];
    for (let i = 0; i < employeesRaw.length; i++) {
      const raw = employeesRaw[i];
      const dept = departments.find(d => d.code === raw.code);
      
      const avatarGender = i % 2 === 0 ? 'women' : 'men';
      const avatarId = Math.floor(Math.random() * 50) + 1;

      let role = 'Employee';
      
      const employee = new Employee({
        name: raw.name,
        email: raw.email,
        phone: raw.phone,
        designation: raw.designation,
        department: dept._id,
        avatar: `https://randomuser.me/api/portraits/${avatarGender}/${avatarId}.jpg`,
        joiningDate: new Date(Date.now() - (Math.floor(Math.random() * 1000) + 50) * 24 * 60 * 60 * 1000), // joined 50 to 1050 days ago
        address: `${100 + i} Enterprise Blvd, Tech Suite ${10 + i}, Austin, TX`,
        password: 'Password123',
        role: role,
        status: 'Active'
      });
      
      employees.push(employee);
    }

    // Save employees to database
    await Promise.all(employees.map(e => e.save()));
    console.log(`Created ${employees.length} employees.`);

    // Set heads of department and managers
    const david = employees.find(e => e.name === 'David Chen');
    const sarah = employees.find(e => e.name === 'Sarah Jenkins');
    const elena = employees.find(e => e.name === 'Elena Rostova');
    const marcus = employees.find(e => e.name === 'Marcus Sterling');
    const aisha = employees.find(e => e.name === 'Aisha Rahman');

    // Update departments with their heads
    await Department.findByIdAndUpdate(departments.find(d => d.code === 'ENG')._id, { head: david._id });
    await Department.findByIdAndUpdate(departments.find(d => d.code === 'HR')._id, { head: sarah._id });
    await Department.findByIdAndUpdate(departments.find(d => d.code === 'PRD')._id, { head: elena._id });
    await Department.findByIdAndUpdate(departments.find(d => d.code === 'DSN')._id, { head: marcus._id });
    await Department.findByIdAndUpdate(departments.find(d => d.code === 'MKT')._id, { head: aisha._id });

    // Update employees with managers
    for (let emp of employees) {
      if (emp.name === 'David Chen' || emp.name === 'Sarah Jenkins' || emp.name === 'Elena Rostova' || emp.name === 'Marcus Sterling' || emp.name === 'Aisha Rahman') {
        continue; // top leaders have no manager
      }
      
      let managerId = null;
      const dept = departments.find(d => d._id.toString() === emp.department.toString());
      if (dept.code === 'ENG') managerId = david._id;
      else if (dept.code === 'HR') managerId = sarah._id;
      else if (dept.code === 'PRD') managerId = elena._id;
      else if (dept.code === 'DSN') managerId = marcus._id;
      else if (dept.code === 'MKT') managerId = aisha._id;

      await Employee.findByIdAndUpdate(emp._id, { manager: managerId });
    }
    console.log('Linked managers and department heads.');

    // 4. Generate Teams (6)
    const teamsData = [
      { name: 'Frontend Platform', description: 'Core React architectural assets and component libraries', code: 'ENG', leadName: 'Chloe Fraser', memberNames: ['Devon Lane', 'Zoe Washburne'] },
      { name: 'Core Backend', description: 'High performance database microservices and APIs', code: 'ENG', leadName: 'Alex Mercer', memberNames: ['Ethan Hunt', 'Devon Lane'] },
      { name: 'UX Research', description: 'Synthesizing quantitative and qualitative user data', code: 'DSN', leadName: 'Marcus Sterling', memberNames: ['Guy Hawkins', 'Jenny Wilson'] },
      { name: 'Product Growth', description: 'Conversion rate optimization and retention metrics', code: 'PRD', leadName: 'Cody Fisher', memberNames: ['Dianne Russell', 'Albert Flores'] },
      { name: 'Brand & Creative', description: 'Aesthetic visual direction, illustrations, and marketing collateral', code: 'DSN', leadName: 'Esther Howard', memberNames: ['Jenny Wilson', 'Guy Hawkins'] },
      { name: 'Talent Acquisition', description: 'Attracting and hiring top enterprise talent', code: 'HR', leadName: 'Floyd Miles', memberNames: ['Courtney Henry'] }
    ];

    const teams = [];
    for (let t of teamsData) {
      const dept = departments.find(d => d.code === t.code);
      const lead = employees.find(e => e.name === t.leadName);
      const memberIds = employees.filter(e => t.memberNames.includes(e.name)).map(e => e._id);
      
      const team = new Team({
        name: t.name,
        description: t.description,
        department: dept._id,
        lead: lead._id,
        members: [lead._id, ...memberIds]
      });
      teams.push(team);
    }
    await Team.insertMany(teams);
    console.log(`Created ${teams.length} teams.`);

    // 5. Generate Projects (8)
    const projectsData = [
      { name: 'Aurora Design System', description: 'Modern design token standard and Tailwind/Bootstrap components library', priority: 'High', status: 'Active', durationMonths: 6, completionPct: 65 },
      { name: 'WorkSphere Mobile App', description: 'Native companion mobile application for Android and iOS systems', priority: 'High', status: 'Active', durationMonths: 9, completionPct: 40 },
      { name: 'Enterprise Analytics Dashboard', description: 'Real-time database query visualizations, analytics metrics, and reports exporting', priority: 'Medium', status: 'Active', durationMonths: 4, completionPct: 80 },
      { name: 'API Gateway Refactoring', description: 'Migrating monolithic routing structures into a scalable Express/Node gateway', priority: 'Medium', status: 'Planning', durationMonths: 3, completionPct: 0 },
      { name: 'Client Portal Integration', description: 'Third-party client portal dashboard with secure sharing and chat capabilities', priority: 'Low', status: 'On Hold', durationMonths: 5, completionPct: 15 },
      { name: 'Global Brand Refresh 2026', description: 'Updated colors, logos, landing pages, and content kits across all company assets', priority: 'High', status: 'Completed', durationMonths: 2, completionPct: 100 },
      { name: 'HR Automations v2', description: 'Self-service employee portal automating leave approvals and profile settings', priority: 'Medium', status: 'Active', durationMonths: 4, completionPct: 50 },
      { name: 'SEO & Growth Campaign', description: 'Content optimization and paid advertisement campaigns targeting enterprise sectors', priority: 'Low', status: 'Archived', durationMonths: 3, completionPct: 90 }
    ];

    const projects = [];
    for (let i = 0; i < projectsData.length; i++) {
      const p = projectsData[i];
      const start = new Date();
      start.setDate(start.getDate() - (i % 2 === 0 ? 30 : 60)); // started 1 or 2 months ago
      const end = new Date(start);
      end.setDate(end.getDate() + p.durationMonths * 30);

      // assign random members (4 per project)
      const projectMembers = [];
      const shuffled = [...employees].sort(() => 0.5 - Math.random());
      for (let k = 0; k < 5; k++) {
        projectMembers.push(shuffled[k]._id);
      }

      const project = new Project({
        name: p.name,
        description: p.description,
        priority: p.priority,
        status: p.status,
        progress: p.completionPct,
        startDate: start,
        endDate: end,
        members: projectMembers,
        createdBy: admin._id,
        milestones: [
          { title: 'Research & Wireframing', dueDate: new Date(start.getTime() + 15 * 24 * 60 * 60 * 1000), completed: p.completionPct >= 20 },
          { title: 'Alpha Architecture Release', dueDate: new Date(start.getTime() + 45 * 24 * 60 * 60 * 1000), completed: p.completionPct >= 50 },
          { title: 'Beta Testing & Integration', dueDate: new Date(start.getTime() + 75 * 24 * 60 * 60 * 1000), completed: p.completionPct >= 80 },
          { title: 'Final Production Deployment', dueDate: end, completed: p.completionPct === 100 }
        ]
      });
      projects.push(project);
    }
    await Project.insertMany(projects);
    console.log(`Created ${projects.length} projects.`);

    // 6. Generate Tasks (100)
    // Distributed across projects, assignees, priorities, and statuses
    const statuses = ['Todo', 'In Progress', 'Review', 'Done'];
    const priorities = ['Low', 'Medium', 'High', 'Urgent'];
    const taskKeywords = [
      { title: 'Design Landing Page Wireframes', desc: 'Draft initial Figma wireframes for the promotional and desktop portals' },
      { title: 'Setup Mongoose Schema Configurations', desc: 'Construct Mongoose models and data relationships for database storage' },
      { title: 'Write Integration Test Pipelines', desc: 'Deploy automated test environments using Jest and supertest framework' },
      { title: 'Implement Collapsible Navigation Panel', desc: 'Build reactive collapsible layout configurations with custom CSS handles' },
      { title: 'Integrate Recharts Graphical Controls', desc: 'Develop department and weekly load visualizations using Recharts components' },
      { title: 'Refactor Auth Route Middlewares', desc: 'Abstract route authentication parameters to prepare for future JWT extensions' },
      { title: 'Deploy MongoDB Atlas Sandbox Cluster', desc: 'Create deployment database indexes and test connectivity configurations' },
      { title: 'Formulate Content Strategy Roadmaps', desc: 'Prepare editorial guides and copy templates for upcoming social campaigns' },
      { title: 'Revamp Employee Directory Table Grid', desc: 'Convert legacy list configurations to a paginated, search-friendly layout' },
      { title: 'Fix Layout Resizing Shifts', desc: 'Correct CSS constraints causing layouts to shift when toggling navigation panel' },
      { title: 'Apply Leave Summary Balance Engine', desc: 'Write service queries calculating taken and remaining vacation times' },
      { title: 'Create Toast Feed Providers', desc: 'Deploy centralized Toast configurations in React context for CRUD feedback' },
      { title: 'Write Seed Script Operations', desc: 'Construct mock database records seeding project collections with mock elements' },
      { title: 'Review Code Styling Standards', desc: 'Align styles with Poppins and Inter typography font constraints' },
      { title: 'Verify Table Responsive Overflows', desc: 'Enable horizontal scrolling configurations on small viewport tables' }
    ];

    const tasks = [];
    for (let i = 1; i <= 100; i++) {
      const project = projects[i % projects.length];
      const assignee = employees[i % employees.length];
      const keyword = taskKeywords[i % taskKeywords.length];
      const priority = priorities[i % priorities.length];
      
      // Determine status based on index and project status
      let status = statuses[i % statuses.length];
      if (project.status === 'Completed') status = 'Done';
      else if (project.status === 'Planning') status = 'Todo';

      const start = new Date();
      start.setDate(start.getDate() - (i % 10)); // created 0 to 9 days ago
      const due = new Date(start);
      due.setDate(due.getDate() + (i % 15) + 3); // due in 3 to 17 days

      // Mock comments for some tasks
      const comments = [];
      if (i % 3 === 0) {
        comments.push({
          author: employees[(i + 1) % employees.length].name,
          text: `Finished reviewing this. Let's make sure the styling handles Bootstrap classes correctly.`,
          createdAt: new Date(start.getTime() + 12 * 60 * 60 * 1000)
        });
      }
      if (i % 5 === 0) {
        comments.push({
          author: assignee.name,
          text: `I've started working on this branch. Pull request should be ready for review tomorrow morning.`,
          createdAt: new Date(start.getTime() + 24 * 60 * 60 * 1000)
        });
      }

      const task = new Task({
        title: `${keyword.title} #${1000 + i}`,
        description: `${keyword.desc}. Please adhere to standard architectural guidelines.`,
        priority,
        status,
        dueDate: due,
        assignee: assignee._id,
        project: project._id,
        labels: [project.name.split(' ')[0], priority],
        comments,
        attachments: i % 7 === 0 ? [{ name: 'spec_sheet.pdf', url: 'https://worksphere.com/files/spec_sheet.pdf', size: 1024000 }] : []
      });
      tasks.push(task);
    }
    await Task.insertMany(tasks);
    console.log(`Created ${tasks.length} tasks.`);

    // 7. Generate Leave Requests (15)
    const leaveTypes = ['Annual', 'Sick', 'Maternity/Paternity', 'Unpaid'];
    const leaveStatuses = ['Pending', 'Approved', 'Rejected'];
    const leaves = [];

    for (let i = 0; i < 15; i++) {
      const employee = employees[i % employees.length];
      const type = leaveTypes[i % leaveTypes.length];
      const status = leaveStatuses[i % leaveStatuses.length];

      const start = new Date();
      start.setDate(start.getDate() + (i % 3 === 0 ? -10 : i + 2)); // past or future
      const end = new Date(start);
      end.setDate(end.getDate() + (i % 5) + 1); // 1 to 5 days duration

      const leave = new Leave({
        employee: employee._id,
        type,
        startDate: start,
        endDate: end,
        reason: `Need dynamic time off for ${type.toLowerCase()} reasons. Thanks!`,
        status,
        approvedBy: status !== 'Pending' ? david._id : null
      });
      leaves.push(leave);
    }
    await Leave.insertMany(leaves);
    console.log(`Created ${leaves.length} leave requests.`);

    // 8. Generate Notifications (20)
    const notificationCategories = ['Task', 'Project', 'Leave', 'Announcement'];
    const notifications = [];

    for (let i = 0; i < 20; i++) {
      const category = notificationCategories[i % notificationCategories.length];
      const isGlobal = i % 4 === 0;
      const recipient = isGlobal ? null : employees[i % employees.length]._id;
      
      const notification = new Notification({
        title: `Notification: ${category} Update`,
        message: `There is a new update in your ${category.toLowerCase()} dashboard. Please check details.`,
        category,
        recipient,
        isRead: i % 3 === 0
      });
      notifications.push(notification);
    }
    await Notification.insertMany(notifications);
    console.log(`Created ${notifications.length} notifications.`);

    // 9. Generate Announcements (10)
    const announcementCategories = ['Company', 'HR', 'Project', 'Social'];
    const announcementTitles = [
      'WorkSphere Q3 General Meeting Scheduled',
      'Updates to Company Health Insurance Policies',
      'Launch of Aurora Design Tokens Integration',
      'Welcoming our New Engineering Cohort!',
      'Office Renovations: Austin Suite Details',
      'WorkSphere Summer Hackathon Winners Announced',
      'New Guidelines for Remote Work Allowances',
      'Design Team Brainstorming Session: Q4 Roadmap',
      'Mongoose Version 8 Database Migration Completed',
      'Annual Company Retreat in Denver - RSVP Open'
    ];

    const announcements = [];
    for (let i = 0; i < 10; i++) {
      const title = announcementTitles[i];
      const category = announcementCategories[i % announcementCategories.length];
      const publisher = employees[i % 5]; // published by top 5 leaders
      
      const announcement = new Announcement({
        title,
        content: `Hello Team,\n\nWe are excited to share details about "${title}". This operation aims to expand our scalability and digital workplace capabilities. Please join the conversation in Slack or check document guidelines attached to your profiles.\n\nBest Regards,\nWorkSphere Operations Team`,
        category,
        publishedBy: publisher._id,
        isPinned: i < 2 // first two pinned
      });
      announcements.push(announcement);
    }
    await Announcement.insertMany(announcements);
    console.log(`Created ${announcements.length} announcements.`);

    // 10. Generate Documents (10)
    const documentCategories = ['Policy', 'Project', 'Finance', 'Templates'];
    const documentNames = [
      'Employee_Handbook_2026.pdf',
      'Aurora_Design_Tokens_Draft.fig',
      'Quarterly_Financial_Report_Q2.xlsx',
      'API_Developer_Styleguide.md',
      'Product_Launch_Marketing_Deck.pptx',
      'Health_Benefits_Premium_Plans.pdf',
      'Standard_SOW_Contract_Template.docx',
      'Backend_Architecture_Diagrams.pdf',
      'Austin_Office_Reopening_Guidelines.pdf',
      'Q3_Project_Milestones_Summary.xlsx'
    ];

    const documents = [];
    for (let i = 0; i < 10; i++) {
      const name = documentNames[i];
      const category = documentCategories[i % documentCategories.length];
      const project = i % 2 === 0 ? projects[i % projects.length]._id : null;

      const doc = new Document({
        name,
        category,
        fileUrl: `https://worksphere.com/files/${name}`,
        fileSize: Math.floor(Math.random() * 5000000) + 50000, // 50KB to 5MB
        uploadedBy: employees[i % employees.length]._id,
        project
      });
      documents.push(doc);
    }
    await Document.insertMany(documents);
    console.log(`Created ${documents.length} documents.`);

    // 11. Generate Activity Logs (100)
    const actions = ['Created', 'Updated', 'Deleted'];
    const entities = ['Employee', 'Project', 'Task', 'Leave', 'Announcement', 'Document', 'Department', 'Team'];
    const logs = [];

    for (let i = 1; i <= 100; i++) {
      const action = actions[i % actions.length];
      const entity = entities[i % entities.length];
      
      let refId = null;
      let desc = '';
      
      if (entity === 'Employee') {
        const item = employees[i % employees.length];
        refId = item._id;
        desc = `${action} employee record for ${item.name}`;
      } else if (entity === 'Project') {
        const item = projects[i % projects.length];
        refId = item._id;
        desc = `${action} project profile for "${item.name}"`;
      } else if (entity === 'Task') {
        const item = tasks[i % tasks.length];
        refId = item._id;
        desc = `${action} task "${item.title.substring(0, 30)}..."`;
      } else if (entity === 'Leave') {
        const item = leaves[i % leaves.length];
        refId = item._id;
        desc = `Updated leave request for employee status to ${item.status}`;
      } else if (entity === 'Announcement') {
        const item = announcements[i % announcements.length];
        refId = item._id;
        desc = `${action} company news notice "${item.title}"`;
      } else if (entity === 'Document') {
        const item = documents[i % documents.length];
        refId = item._id;
        desc = `${action} document metadata record for ${item.name}`;
      } else if (entity === 'Department') {
        const item = departments[i % departments.length];
        refId = item._id;
        desc = `${action} department grouping "${item.name}"`;
      } else if (entity === 'Team') {
        const item = teams[i % teams.length];
        refId = item._id;
        desc = `${action} functional team group "${item.name}"`;
      }

      const log = new ActivityLog({
        timestamp: new Date(Date.now() - (i * 1.5) * 60 * 60 * 1000), // logging from now to 150 hours ago
        user: employees[i % employees.length].name,
        action,
        entity,
        entityId: refId,
        description: desc
      });
      logs.push(log);
    }
    await ActivityLog.insertMany(logs);
    console.log(`Created ${logs.length} activity logs.`);

    console.log('Database successfully seeded with mock data!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

connectDB().then(() => {
  seedData();
});
