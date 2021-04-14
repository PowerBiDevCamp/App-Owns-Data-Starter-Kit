# The App-Owns-Data Starter Kit

The  **App-Owns-Data Starter Kit** is a developer sample built using the
.NET 5 SDK which demonstrates how to design and implement a solution for
App-Owns-Data embedding with Power BI in a multi-tenant environment.

If you have worked with Azure AD, the word **"tenant"** might make you
think of an Azure AD tenant. However, the concept of a tenant is
different when designing a multi-tenant environment for App-Owns-Data
embedding. In this context, each tenant represents a customer for which
you are embedding Power BI reports using the app-owns-data embedding
model. In order to manage a multi-tenant environment, you must create a
separate tenant for each customer. Provisioning a new customer tenant
for Power BI embedding typically involves writing code to create a Power
BI workspace, import a PBIX file, patch datasource credentials and start
a dataset refresh operation.

The problem that **App-Owns-Data Starter Kit** addresses.

-   Onboarding new custom tenant

-   Managing user permissions

-   Creating a custom telemetry layer to log user activity

-   Monitoring user actions and report performance

The solution is built on top of a custom SQL Server database named
**AppOwnsDataDB**. In addition to the **AppOwnsDataDB** database, the
solution contains the following three Web application projects.

-   **AppOwnsDataAdmin**: An ASP.NET MVC Web Application used to
    provision custom tenants and manager users

-   **AppOwnsClient**: A single page application built using HTML, CSS
    and Typescript

-   **AppOwnsDataWebApi**: Custom Web API used AppOwnsData client to get
    embedding data and embed tokens.

<img src="Images\ReadMe\media\image1.png" style="width:5.86409in;height:2.725in" />

You can follow the steps in this document to set up the **App-Owns-Data
Starter Kit** solution for testing. To complete these steps, you will
require a Microsoft 365 tenant in which you have permissions to create
and manage Azure AD applications and security groups. You will also need
Power BI Service administrator permissions to configure Power BI
settings to give service principals to ability to access the Power BI
Service API. If you do not have a Microsoft 365 environment for testing,
you can create one for free by following the steps in [Create a
Development Environment for Power BI
Embedding](https://github.com/PowerBiDevCamp/Camp-Sessions/raw/master/Create%20Power%20BI%20Development%20Environment.pdf).

## Set up your development environment

To set up the  **App-Owns-Data Starter Kit** solution for testing, you
will need to configure a Microsoft 365 environment by completing the
following tasks.

1.  Create an Azure AD security group named **Power BI Apps**

2.  Configure Power BI tenant-level settings for service principal
    access

3.  Create the Azure AD Application for
    the **AppOwnsDataAdmin** Application

The following three sections will step through each of these setup
tasks.

### Create an Azure AD security group named Power BI Apps

Begin by navigating to the [Groups management
page](https://portal.azure.com/#blade/Microsoft_AAD_IAM/GroupsManagementMenuBlade/AllGroups) in
the Azure portal. Once you get to the **Groups** page in the Azure
portal, click the **New group** link.

<img src="Images\ReadMe\media\image2.png" style="width:3.91228in;height:1.302in" alt="Graphical user interface, text, application Description automatically generated" />

In the **New Group** dialog, Select a **Group type** of **Security** and
enter a **Group name** of **Power BI Apps**. Click the **Create** button
to create the new Azure AD security group.

<img src="Images\ReadMe\media\image3.png" style="width:3.91181in;height:1.80963in" alt="Graphical user interface, text, application, email Description automatically generated" />

Verify that you can see the new security group named **Power BI
Apps** on the Azure portal **Groups** page.

<img src="Images\ReadMe\media\image4.png" style="width:4.08772in;height:1.18963in" alt="Graphical user interface, text, application Description automatically generated" />

### Configure Power BI tenant-level settings for service principal access

Next, you need you enable a tenant-level setting for Power BI
named **Allow service principals to use Power BI APIs**. Navigate to the
Power BI Service admin portal at <https://app.powerbi.com/admin-portal>.
In the Power BI Admin portal, click the **Tenant settings** link on the
left.

<img src="Images\ReadMe\media\image5.png" style="width:3.08902in;height:2.01754in" alt="Graphical user interface, application Description automatically generated" />

Move down in the **Developer settings** section and expand the **Allow
service principals to use Power BI APIs** section.

<img src="Images\ReadMe\media\image6.png" style="width:3.31579in;height:2.04355in" alt="Graphical user interface, application Description automatically generated" />

Note that the **Allow service principals to use Power BI APIs** setting
is initially set to **Disabled**.

<img src="Images\ReadMe\media\image7.png" style="width:4.10862in;height:2in" alt="Graphical user interface, text, application, email Description automatically generated" />

Change the setting to **Enabled**. After that, set the **Apply
to** setting to **Specific security groups** and add the **Power BI
Apps** security group as shown in the screenshot below. Click
the **Apply** button to save your configuration changes.

<img src="Images\ReadMe\media\image8.png" style="width:4.04948in;height:2.66667in" alt="Graphical user interface, text, application Description automatically generated" />

You will see a notification indicating it might take up to 15 minutes to
apply these changes to the organization.

<img src="Images\ReadMe\media\image9.png" style="width:4.52778in;height:0.81597in" alt="Text Description automatically generated with medium confidence" />

Now scroll upward in the **Tenant setting** section of the Power BI
admin portal and locate **Workspace settings**.

<img src="Images\ReadMe\media\image10.png" style="width:4.97693in;height:2.49123in" alt="Graphical user interface, application, Teams Description automatically generated" />

Note that a new Power BI tenant has an older policy where only users who
have the permissions to create Office 365 groups can create new Power BI
workspaces. You must reconfigure this setting so that service principals
in the **Power BI Apps** group will be able to create new workspaces.

<img src="Images\ReadMe\media\image11.png" style="width:4.91353in;height:2.47368in" alt="Graphical user interface, text, application, email Description automatically generated" />

In **Workspace settings**, set **Apply to** to **Specific security**
groups, add the **Power BI Apps** security group and click
the **Apply** button to save your changes.

<img src="Images\ReadMe\media\image12.png" style="width:4.4in;height:3.87241in" />

You have now completed the configuration of Power BI tenant-level
settings.

### Create the **App-Owns-Data Service App in Azure AD**

Login to the Azure portal to create the new Azure AD application. Begin
by navigating to the [App
registration](https://portal.azure.com/#blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/RegisteredApps) page
in the Azure portal and click the **New registration** link.

<img src="Images\ReadMe\media\image13.png" style="width:6.5in;height:1.80486in" alt="Graphical user interface, text, application, email Description automatically generated" />

On the **Register an application** page, enter an application name of
**App-Owns-Data Service App** and accept the default selection
for **Supported account types** of **Accounts in this organizational
directory only**.

<img src="Images\ReadMe\media\image14.png" style="width:9.31667in;height:4.54167in" />

Complete the following steps in the **Redirect URI** section.

1.  Leave the default selection of **Web** in the dropdown box

2.  Enter a **Redirect
    URI** of [**https://localhost:44300/signin-oidc**](https://localhost:44300/signin-oidc)

3.  Click the **Register** button to create the new Azure AD
    application.

<img src="Images\ReadMe\media\image15.png" style="width:6.5in;height:1.81875in" alt="Graphical user interface, text, application Description automatically generated" />

After creating a new Azure AD application in the Azure portal, you
should see the Azure AD application overview page which displays
the **Application ID**. Note that the ***Application ID*** is often
called the ***Client ID***, so don't let this confuse you. You will need
to copy this Application ID and store it so you can use it later to
configure the project's support for Client Credentials Flow.

<img src="Images\ReadMe\media\image16.png" style="width:8.01667in;height:3.03333in" />

Copy the **Client ID** (aka Application ID) and paste it into a text
document so you can use it later in the setup process. Note that
this **Client ID** value will be used by **AppOwnsDataAdmin** project
and the **AppOwnsDataWebApi** project to configure authentication with
Azure AD.

<img src="Images\ReadMe\media\image17.png" style="width:5.375in;height:1.65833in" />

Next, repeat the same step by copying the **Tenant ID** and copying that
into the text document as well.

<img src="Images\ReadMe\media\image18.png" style="width:5.43333in;height:1.35833in" />

Your text document should now contain the **Client ID** and **Tenant
ID** as shown in the following screenshot.

<img src="Images\ReadMe\media\image19.png" style="width:5.36667in;height:2.525in" />

Next, you need to create a Client Secret for the application. Click on
the **Certificates & secrets** link in the left navigation to move to
the **Certificates & secrets** page. On the **Certificates &
secrets** page, click the **New client secret** button as shown in the
following screenshot.

<img src="Images\ReadMe\media\image20.png" style="width:13.01667in;height:6.13333in" />

In the **Add a client secret** dialog, add a text description such
as **Test Secret** and then click the **Add** button to create the new
Client Secret.

<img src="Images\ReadMe\media\image21.png" style="width:4.125in;height:2.07009in" />

Once you have created the Client Secret, you should be able to see
its **Value** in the **Client secrets** section. Click on the **Copy to
clipboard** button to copy the Client Secret into the clipboard.

<img src="Images\ReadMe\media\image22.png" style="width:5.4386in;height:1.50495in" alt="Graphical user interface, text, application, email Description automatically generated" />

Paste the **Client Secret** into the same text document with
the **Client ID** and **Tenant ID**.

<img src="Images\ReadMe\media\image23.png" style="width:5.85in;height:3.28333in" />

Last thing is to add the service principal for this app to Azure AD
Security group named Power BI Apps.

<img src="Images\ReadMe\media\image24.png" style="width:8.85833in;height:3.68333in" />

<img src="Images\ReadMe\media\image25.png" style="width:10.225in;height:3.05994in" />

### Create the Azure AD Application for the **App-Owns-Data Client App**

Login to the Azure portal to create the new Azure AD application. Begin
by navigating to the [App
registration](https://portal.azure.com/#blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/RegisteredApps) page
in the Azure portal and click the **New registration** link.

<img src="Images\ReadMe\media\image13.png" style="width:6.5in;height:1.80486in" alt="Graphical user interface, text, application, email Description automatically generated" />

On the **Register an application** page, enter an application name of
**App-Owns-Data Client App** and change **Supported account
types** to **Accounts in any organizational directory and personal
Microsoft accounts**.

<img src="Images\ReadMe\media\image26.png" style="width:9.70833in;height:3.825in" />

Complete the following steps in the **Redirect URI** section.

1.  Leave the default selection of **Web** in the dropdown box

2.  Enter a **Redirect
    URI** of [**https://localhost:44301/**](https://localhost:44301/).

3.  Click the **Register** button to create the new Azure AD
    application.

<img src="Images\ReadMe\media\image27.png" style="width:10.38333in;height:3.18333in" />

After creating a new Azure AD application in the Azure portal, you
should see the Azure AD application overview page which displays
the **Application ID**. Copy the **Client ID** (aka Application ID) and
paste it into a text document so you can use it later in the setup
process. Note that this **Client ID** value will be used
by **AppOwnsDataClient** project and the **AppOwnsDataWebApi** project
to configure authentication with Azure AD.

<img src="Images\ReadMe\media\image28.png" style="width:5.55in;height:4.36667in" />

Expose an

<img src="Images\ReadMe\media\image29.png" style="width:7.29167in;height:3.99589in" />

<img src="Images\ReadMe\media\image30.png" style="width:9.1in;height:3.22233in" />

<img src="Images\ReadMe\media\image31.png" style="width:6.99167in;height:3.30833in" />

<img src="Images\ReadMe\media\image32.png" style="width:6.16667in;height:3.79167in" />

<img src="Images\ReadMe\media\image33.png" style="width:6.99167in;height:6.35833in" />

<img src="Images\ReadMe\media\image34.png" style="width:10.875in;height:3.3in" />

N n n n

api://046a89da-c98e-40f0-a11b-a3d71289556f/Reports.Embed

kkmkmkm

## Open he App-Owns-Data Starter Kit solution in Visual Studio 2019

In order to run and test the **AppOwnsDataAdmin** project on a developer
workstation, you must install the .NET 5 SDK and Visual Studio 2019.
While this document will walk through the steps of opening and running
the **AppOwnsDataAdmin** project using Visual Studio 2019, you can also
open and run the project using Visual Studio Code if you prefer that
IDE. Here are links to download this software if you need them.

1.  .NET 5 SDK –
    \[[download](https://dotnet.microsoft.com/download/dotnet/5.0)\]

2.  Visual Studio 2019 –
    \[[download](https://visualstudio.microsoft.com/downloads/)\]

3.  Visual Studio Code –
    \[[download](https://code.visualstudio.com/Download)\]

### Download the Source Code

The source code for the **App-Owns-Data Starter Kit** solution is
maintained in a GitHub repository at the following URL.

<https://github.com/PowerBiDevCamp/App-Owns-Data-Starter-Kit>

<img src="Images\ReadMe\media\image35.png" style="width:9.1in;height:2.98222in" />

You can download the **AppOwnsDataAdmin** project source files in a
single ZIP archive using [this
link](https://github.com/PowerBiDevCamp/App-Owns-Data-Starter-Kit/archive/refs/heads/main.zip).

<img src="Images\ReadMe\media\image36.png" style="width:7.06667in;height:2.57254in" />

If you are familiar with the **git** utility, you can clone the project
source files to your local developer workstation using the
following **git** command.

**git clone
https://github.com/PowerBiDevCamp/App-Owns-Data-Starter-Kit.git**

Once you have downloaded the source files for the **App-Owns-Data
Starter Kit** solution to your developer workstation, you will see there
is a top-level solution folder named **AppOwnsDataStarterKit** which
contains child folders for four projects named **AppOwnsDataAdmin**,
**AppOwnsClient**, **AppOwnsDataShared** and **AppOwnsDataWebApi**. You
can open the Visual Studio solution containing all four projects by
double-clicking the solution file named **AppOwnsDataStarterKit.sln**.

<img src="Images\ReadMe\media\image37.png" style="width:9.525in;height:3.91667in" />

### Open the Solution in Visual Studio 2019

Launch Visual Studio 2019 and use the **File &gt; Open &gt;
Project/Solution** menu command to open the solution file
named **AppOwnsDataStarterKit.sln**. You should see the four child
projects named **AppOwnsDataAdmin**, **AppOwnsClient**,
**AppOwnsDataShared** and **AppOwnsDataWebApi**.

<img src="Images\ReadMe\media\image38.png" style="width:4.40833in;height:2.19167in" />

Here is a brief description of each of these projects.

-   **AppOwnsDataAdmin**: An ASP.NET MVC Web Application built using
    .NET 5

-   **AppOwnsClient**: A single page application built using HTML, CSS
    and Typescript

-   **AppOwnsDataShared**: A class library project with Entry Framework
    code to generate the solution database named **AppOwnsDataDB**.

-   **AppOwnsDataWebApi**: Custom Web API used AppOwnsData client to get
    embedding data and embed tokens.

### Update the appsettings.json file of AppOwnsDataAdmin project

Before you can run the application in the Visual Studio debugger, you
must update several critical application settings in
the **appsettings.json** file. Open the **appsettings.json** file and
examine the JSON content inside. There is three important sections
named **AzureAd**, **AppOwnsDataDB** and **DemoSettings**.

<img src="Images\ReadMe\media\image39.png" style="width:14.2in;height:4.95833in" />

Inside the **AzureAd** section, update
the **TenantId**, **ClientId** and **ClientSecret** with the data you
collected when creating the Azure AD application named **Power BI Tenant
Management Application.**

<img src="Images\ReadMe\media\image40.png" style="width:3.59649in;height:1.36527in" alt="Text Description automatically generated" />

If you are using Visual Studio 2019, you should be able leave the
database connection string the way it is with the **Server** setting
of **(localdb)\\\\MSSQLLocalDB**. You can change this connection string
to point to a different server if you'd rather create the project
database named **AppOwnsDataDB** in a different location.

<img src="Images\ReadMe\media\image41.png" style="width:6.5in;height:0.8375in" alt="Text Description automatically generated with low confidence" />

In the **DemoSettings** section there is a property named **AdminUser**.
The reason that this property exists has to with you being able to see
Power BI workspaces as they are created by service principals. There is
code in the **AppOwnsDataAdmin** application that will add the user
specified by the **AdminUser** setting as a workspace admin any times it
creates a new Power BI workspace. This just makes things much easier for
you to see what's going on when you begin to run and test the
application.

Update the **AdminUser** setting with your Azure AD account name so that
you will be able to see all the Power BI workspaces created by this
application.

<img src="Images\ReadMe\media\image42.png" style="width:4.68681in;height:1.52153in" alt="Graphical user interface, text, application, email Description automatically generated" />

### Create the **AppOwnsDataDB** database

Before you can run the application in Visual Studio, you must create the
project database named **AppOwnsDataDB**. This database schema has been
created using the .NET 5 version of the Entity Framework. In this step,
you will execute two PowerShell cmdlets provided by Entity Framework to
create the database.

Before creating the **AppOwnsDataDB** database, take a moment to
understand how it’s been structured. Start by opening the file
named **AppOwnsDataDB.cs** in the **Models** folder. Note that you
shouldn't make any change to **AppOwnsDataDB.cs**. You are just going to
inspect the file you understand how the **AppOwnsDataDB** database is
generated.

<img src="Images\ReadMe\media\image43.png" style="width:10.4in;height:3.95833in" />

When you inspect the code inside **AppOwnsDataDB.cs**, you will see a
class named **AppOwnsDataDB** that derives from **DbContext** to add
support for automatic database generation using Entity Framework.
The **AppOwnsDataDB** class serves as the top-level class for the Entity
Framework which contains three  **DBSet** properties
named **AppIdentites** and **Tenants**. When you generate the database,
each of these **DBSet** properties will be created as database tables.
The **AppIdentites** table is generated using the table schema defined
by the **PowerBiAppIdentity** class.

<img src="Images\ReadMe\media\image44.png" style="width:5.175in;height:2.55833in" />

The **Tenants** table is generated using the table schema defined by
the **PowerBiTenant** class.

<img src="Images\ReadMe\media\image45.png" style="width:4.29167in;height:2.51667in" />

<img src="Images\ReadMe\media\image46.png" style="width:4.75in;height:4.05in" />

After you have inspected the code used to generated the database, close
the source file named **AppOwnsDataDB.cs** without saving any changes.
The next step is to run the PowerShell commands to create the project
database named **AppOwnsDataDB**.

Open the Package Manager console using **Tools &gt; NuGet Package
Manager &gt; Package Manager Console**.

<img src="Images\ReadMe\media\image47.png" style="width:6.2912in;height:1.925in" alt="Graphical user interface, application Description automatically generated" />

You should see the **Package Manager Console** command prompt where you
can execute PowerShell commands.

<img src="Images\ReadMe\media\image48.png" style="width:9.8in;height:4.30833in" />

<img src="Images\ReadMe\media\image49.png" style="width:4.7in;height:5.38333in" />

<img src="Images\ReadMe\media\image50.png" style="width:9.825in;height:3.31667in" />

Type and execute the following **Add-Migration** command to create a new
Entity Framework migration in the project.

Add-Migration InitialCreate

The **Add-Migration** command should run without errors. If this command
fails you might have to modify the database connection string
in **appsettings.json**.

<img src="Images\ReadMe\media\image51.png" style="width:8.15in;height:1.65833in" />

After running the Add-Migration command, you will see a new folder has
been added to the project named **Migrations** with several C\# source
files. There is no need to change anything in thee source files but you
can inspect what's inside them if you are curious how the Entity
Framework does its work.

<img src="Images\ReadMe\media\image52.png" style="width:11.96667in;height:5.7in" />

Return to the **Package Manager Console** and run the
following **Update-Database** command to generate the database
named **AppOwnsDataDB**.

Update-Database

The **Update-Database** command should run without errors and generate
the database named **AppOwnsDataDB**.

<img src="Images\ReadMe\media\image53.png" style="width:8.35833in;height:2.8in" />

In Visual Studio, you can use the **SQL Server Object Explorer** to see
the database that has just been created. Open the **SQL Server Object
Explorer** by invoking the **View &gt;** **SQL Server Object
Explorer** menu command.

<img src="Images\ReadMe\media\image54.png" style="width:3.2807in;height:1.73134in" alt="Graphical user interface, text, application Description automatically generated" />

Expand the **Databases** node for the server you are using and verify
you an see the new database named **AppOwnsDataDB**.

<img src="Images\ReadMe\media\image55.png" style="width:3.50833in;height:2.45in" />

If you expand the **Tables** node for **AppOwnsDataDB**, you should see
the two tables named **AppIdentities** and **Tenants**.

<img src="Images\ReadMe\media\image56.png" style="width:3.89363in;height:2.06667in" />

The **AppOwnsDataDB** database has now been set up and you are ready to
run the application in the Visual Studio debugger.

## Test the AppOwnsDataAdmin Application

Launch the **AppOwnsDataAdmin** web application in the Visual Studio
debugger by pressing the **{F5}** key or clicking the Visual
Studio **Play** button with the green arrow and the caption **IIS
Express**.

<img src="Images\ReadMe\media\image57.png" style="width:12.33333in;height:3.98333in" />

When the application starts, click the **Sign in** link in the upper
right corner to begin the user login sequence.

<img src="Images\ReadMe\media\image58.png" style="width:12.25833in;height:4.175in" />

The first time you authenticate with Azure AD, you'll be prompted with
the **Permissions requested** dialog asking you to accept the delegated
permissions for the Microsoft Graph API requested by the application.
Click the **Accept** button to grant these permissions and continue.

<img src="Images\ReadMe\media\image59.png" style="width:4.46667in;height:5.48333in" />

Once you have logged in, you should see your name in the welcome
message.

<img src="Images\ReadMe\media\image60.png" style="width:12.1in;height:3.38333in" />

### Create New Customer Tenants

Start by creating a few new customer tenants. Click the **Tenants** link
to navigate to the **Tenants** page.

<img src="Images\ReadMe\media\image61.png" style="width:12.125in;height:3.44167in" />

Click the **Onboard New Tenant** button to display the **Onboard New
Tenant** page.

<img src="Images\ReadMe\media\image62.png" style="width:12.76667in;height:2.35833in" />

When you open the **Onboard New Tenant** page, it will automatically
populate the **Tenant Name** textbox with a value of **Tenant01**. You
can create the first tenant using the default values supplied by
the **Onboard New Tenant** page or supply a different name. Click
to **Create New Tenant** button to begin the process of creating a new
customer tenant.

<img src="Images\ReadMe\media\image63.png" style="width:13.20833in;height:5.16667in" />

After a few seconds, you should see the new customer tenant has been
created.

Click the **Onboard New Tenant** button again to create a second tenant.

This time, select a different database for **Database Name** and then
click **Create New Tenant**.

<img src="Images\ReadMe\media\image64.png" style="width:4.10622in;height:1.87719in" alt="Graphical user interface, text, application, email Description automatically generated" />

You should now have two customer tenants. Note they each tenant has a
different app identity as its **Owner**.

Follow the same steps to create two more customer tenants.

Now let's discuss what's going on behind the scenes. As you create a new
customer tenant, the **AppOwnsDataAdmin** application uses the Power BI
REST API to implement the following onboarding logic.

1.  Create a new Power BI workspace

2.  Upload a [template PBIX
    file](https://github.com/PowerBiDevCamp/TenantManagement/raw/main/TenantManagement/wwwroot/PBIX/DatasetTemplate.pbix) to
    create the **Sales** dataset and the **Sales** report

3.  Update dataset parameters on **Sales** dataset to point to this
    customer's database

4.  Patch credentials for the SQL datasource used by
    the **Sales** dataset

5.  Start a refresh operation on the **Sales** database

The **AppOwnsDataAdmin** application also create a new record in
the **Tenants** table of the **AppOwnsDataDB** database. Note that the
application identity associated with this customer tenant is tracked in
the **Owner** column.

Click on the **View** button for a specific tenant on the **Power BI
Tenants** page to drill into the **Tenant Details** page.

The **Tenant Details** page displays Power BI workspace details
including its members, datasets and reports.

Click on the back arrow to return to the **Power BI Tenants** page.

If you're interested, you can examine the details of other tenants as
well.

### Embed Reports

Now it's time to make use of the **AppOwnsDataAdmin** application's
ability to embed reports. When navigate to the **Embed** page for a
customer tenant, the **AppOwnsDataAdmin** application must acquire an
access token for whichever app identity was used to create the customer
tenant. The service principal that is configured as the **Owner** of a
tenant will be the only service principal who will have access to access
the target workspace in Power BI.

Move to the **Power BI Tenants** page and click on the **Embed** button
for the first customer tenant.

You should now see a page with an embedded report for that tenant. When
you click the **Embed** button to embed a report for a customer tenant,
the **TenanantManagement** application retrieves credentials for the app
identity associated with the tenant from the **AppOwnsDataDB** database.
It then uses those credentials to acquire an access token from Azure AD
using Client Credentials Flow. That access token is then used to
communicate with the Power BI Service to retrieve report metadata and
generate an embed token for the embedding process.

Click on the back arrow button to return to the **Tenants** page.

Now test clicking the **Embed** button for other customer tenants. As
you can see, the **AppOwnsDataAdmin** application has the ability to
acquire access tokens for any of the Azure AD applications that it has
created.

### Inspect the Power BI Workspaces

If you're curious about what's been created in Power BI, you can see for
yourself by navigating to the Power BI Service portal
at [https://app.powerbi.com](https://app.powerbi.com/). You should be
able to see and navigate to any of the Power BI workspaces that have
been created by the **AppOwnsDataAdmin** application.

<img src="Images\ReadMe\media\image65.png" style="width:1.66667in;height:1.79669in" alt="A picture containing graphical user interface Description automatically generated" />

Navigate to one of these workspaces such as **Tenant01**.

<img src="Images\ReadMe\media\image66.png" style="width:4in;height:1.51111in" alt="Graphical user interface, text, email Description automatically generated" />

Drill into the **Setting** page for the dataset named **Sales**.

<img src="Images\ReadMe\media\image67.png" style="width:3.52632in;height:1.81682in" alt="Graphical user interface, application Description automatically generated" />

You should be able to verify that the **Sales** dataset has been
configured by one of the Azure AD applications that was created by
the **AppOwnsDataAdmin** application. You should also be able to see
the **Last refresh succeeded** message for the dataset refresh operation
that was started by the **AppOwnsDataAdmin** as part of its tenant
onboarding logic.

<img src="Images\ReadMe\media\image68.png" style="width:4.85965in;height:1.41376in" alt="Graphical user interface, application Description automatically generated" />

## Test the AppOwnsDataClient Application

xxxx

### Configure the WebAPI appsettings.

This concludes the walkthrough of the **AppOwnsDataAdmin** application.

### Configure the AppOwnsDataClient application

### Run the AppOwnsDataClient application

### Assign User Permissions

### Create and Edit Reports using AppOwnsDataClient

## Monitoring Usages and Report Performance using Activity Log

### Inspect the Usage Data in AppOwnsDataDB

### Inspect Usage Data using AppOwsDataUsageReporting.pbix
