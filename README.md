# The App-Owns-Data Starter Kit

The  **App-Owns-Data Starter Kit** is a developer sample built using the
.NET 5 SDK to provide guidance for organizations and ISVs who are using
App-Owns-Data embedding with Power BI in a multi-tenant environment.
This solution consists of a custom database and three separate web
applications which demonstrate common design patterns in App-Owns-Data
embedding such as creating new Power BI workspaces for tenants,
assigning user permissions and monitoring report usage and performance.

If you have worked with Azure AD, the word **"tenant"** might make you
think of an Azure AD tenant. However, the concept of a tenant is
different when designing a multi-tenant environment for App-Owns-Data
embedding. In this context, each tenant represents a customer with one
or more users for which you are embedding Power BI reports. In a
multi-tenant environment, you must create a separate tenant for each
customer. Provisioning a new customer tenant in a Power BI embedding
solution typically involves writing code which programs the Power BI
REST API to create a Power BI workspace, assign the workspace to a
dedicated capacity, import PBIX files, patch datasource credentials and
start dataset refresh operations.

There is a critical aspect to App-Owns-Data embedding that you must
start thinking about during the initial design phase. A distinct
advantage of App-Owns-Data embedding is that you pay Microsoft by
licensing dedicated capacities instead of by licensing individual users.
This allows organizations and ISVs to reach users that remain completely
unknown to Power BI. While keeping users unknown to Power BI has its
advantages, it also introduces a new problem that makes things more
complicated than developing with User-Owns-Data embedding.

So, what's the problem? If Power BI doesn’t know anything about your
users, Power BI cannot really provide any assistance when it comes to
authorization and determining which users should have access to what
content. This isn't a problem in a simplistic scenario where you intend
to give every user the same level of access to the exact same content.
However, it's far more common that your application requirements will
define authorization policies to determine which users have access to
which customer tenants. Furthermore, if you're planning to take
advantage of the Power BI embedding support for report authoring, you'll
also need to implement an authorization scheme that allows an
administrator to assign permissions to users with a granularity of view
permissions, edit permissions and content create permissions.

Now let's make three key observations about developing with
App-Owns-Data embedding. First, you have the **flexibility** to design
the authorization scheme for your application any way you'd like.
Second, you have the ***responsibility*** to design and implement this
authorization scheme from the ground up. Third, it's much easier to
prototype and develop an authorization scheme if your application design
includes a ***custom database*** to track whatever data and metadata you
need to implement the authorization policies and policy enforcement you
require.

The **App-Owns-Data Starter Kit** solution provides a starting point for
organizations and ISVs who are beginning to develop with App-Owns-Data
embedding. This solution was created to provide guidance and to
demonstrate implementing the following application requirements that are
common when developing with App-Owns-Data embedding in a multi-tenant.

-   Onboarding new customer tenants

-   Assigning and managing user permissions

-   Implementing the customer-facing client as a Single Page Application
    (SPA)

-   Creating a custom telemetry layer to log user activity

-   Monitoring user actions such as ViewReport, EditReport and
    CreateReport

-   Monitoring the performance of loading and rendering reports

## Solution Architecture

The **App-Owns-Data Starter Kit** solution is built on top of a custom
SQL Server database named **AppOwnsDataDB**. In addition to the
**AppOwnsDataDB** database, the solution contains three Web application
projects named **AppOwnsDataAdmin**, **AppOwnsDataClient** and
**AppOwnsDataWebApi** as shown in the following diagram.

<img src="Images\ReadMe\media\image1.png" style="width:3.46626in;height:1.66217in" />

Let's begin with a brief description of each of these three web
applications.

-   **AppOwnsDataAdmin**: administrative application used to create
    tenants and manage user permissions.

-   **AppOwnsDataClient**: customer-facing SPA used to view and author
    reports.

-   **AppOwnsDataWebApi**: custom Web API used by the
    **AppOwnsDataClient** application.

Now, we'll look at each of these web applications in a little more
depth.

### Understanding the AppOwnsDataAdmin application

The **AppOwnsDataAdmin** application is used by the hosting company to
manage its multi-tenant environment. The **AppOwnsDataAdmin**
application provides administrative users with the ability to create new
customer tenants. The **Onboard New Tenant** form of the
**AppOwnsDataAdmin** application allows you the specify the **Tenant
Name** along with the details to connect to a SQL Server database with
the customer's data.

<img src="Images\ReadMe\media\image2.png" style="width:4in;height:1.4797in" />

When you click the **Create New Tenant** button, the
**AppOwnsDataAdmin** application makes several calls to the Power BI
Service API to provision the new customer tenant. The
**AppOwnsDataAdmin** application calls the Power BI Service under the
identity of a service principal associated with an Azure AD application.
When the service principal creates a new workspace, it is automatically
included as workspace member in the role of Admin giving it full control
over anything inside the workspace. When creating a new Power BI
workspace, the **AppOwnsDataAdmin** application retrieves the new
workspace ID and tracks it with a new record in the **PowerBiTenants**
table in the **AppOwnsDataDB** database.

<img src="Images\ReadMe\media\image3.png" style="width:2.74233in;height:1.28876in" />

After creating a new Power BI workspace, the **AppOwnsDataAdmin**
application continues the tenant onboarding process by importing a
template PBIX file to create a new dataset and report that are both
named **Sales**. Next, the tenant onboarding process updates dataset
parameters redirect the **Sales** dataset to the SQL Server database
that holds the customer's data. After that it patches the datasource
credentials for the SQL Server database and starts a refresh operation
to populate the **Sales** dataset with data from the customer's
database.

After creating customers tenants in the **AppOwnsDataAdmin**
application, they can be viewed, managed or deleted from the **Power BI
Tenants** page.

<img src="Images\ReadMe\media\image4.png" style="width:5.06135in;height:2.0492in" />

The **Edit User** form of **AppOwnsDataAdmin** application provides
administrative users with a UI experience to assign users to a customer
tenant. It also makes it possible to configure the user permission
assignment within a tenant with a granularity of view permissions, edit
permissions and create permissions.

<img src="Images\ReadMe\media\image5.png" style="width:3.60123in;height:1.5039in" />

### Understanding the AppOwnsDataClient application

The **AppOwnsDataClient** application is the web application used by
customers to access embedded reports within a customer tenant. This
application has been created as an SPA to provide the best reach across
different browsers and to provide a responsive design for users
accessing the application using a mobile device or a tablet. Here is a
screenshot of the **AppOwnsDataClient** application when run in the full
browser experience on a desktop or laptop computer.

<img src="Images\ReadMe\media\image6.png" style="width:4.21962in;height:2.32515in" />

The **AppOwnsDataClient** application provides a report authoring
experience when it see the current user has edit permission or create
permissions. For example, the **AppOwnsDataClient** application displays
a **Toggle Edit Mode** button when it sees the current user has edit
permissions. This allows the user to customize a report using the same
report editing experience provided to SaaS users in the Power BI
Service. After customizing a report, a user with edit permissions can
save the changes using the **File &gt; Save** command.

<img src="Images\ReadMe\media\image7.png" style="width:5.69802in;height:3.11429in" />

We live in an age where targeting mobile devices and tablets is a common
application requirement. The **AppOwnsDataClient** application was
created with a responsive design. The PBIX template file for the
**Sales** report provides a mobile view in addition to the standard
master view. There is client-side JavaScript in the
**AppOwnsDataClient** application which determines whether to display
the master view or the mobile view depending on the width of the hosting
device. If you change the width of the browser window, you can see the
report transition between the master view and the responsive view. The
following screenshot shows what the **AppOwnsDataClient** application
looks like when viewed on a mobile device such as an iPhone.

<img src="Images\ReadMe\media\image8.png" style="width:2.12857in;height:3.69316in" />

### Understanding the AppOwnsDataWebAPI application

When developing with App-Owns-Data embedding, it's a best practice to
call the Power BI Service API as a service principal. This requires an
application to implement Client Credentials Flow to interact with Azure
AD and acquire an app-only access token. From an architectural
viewpoint, this type of code must be designed to run on the server-side
and never as client-side code running in the browser. If you were to
pass app-only tokens or the secrets used to acquire them to the browser,
you would introduce a serious security vulnerability in your design. An
attacker that was able to capture an app-only access token would be able
to call into the Power BI Service API with full control over every
tenant workspace in Power BI.

When using App-Owns-Data embedding, you must pass a security token back
to the browser. However, this security token is not an Azure AD access
token but instead an Power BI embed token. Unlike Azure AD access
tokens, embed tokens are created by the Power BI REST API and not Azure
AD. You generate embed tokens by calling the Power BI REST API using the
trusted code that runs as the all-powerful service principal and your
code is able to determine exactly how much (or how little) permissions
you'd like to give to the current user.

The **AppOwnsDataWebApi** application contains the trusted code which
calls the Power BI Service as a service principal. It is also important
to note that **AppOwnsDataWebApi** authenticates with Client Credentials
Flow using the same Azure AD application as **AppOwnsDataAdmin**. That
means that both applications run under the identity of a single service
principal giving **AppOwnsDataWebApi** admin access to any Power BI
workspaces that has been created by **AppOwnsDataAdmin**.

<img src="Images\ReadMe\media\image9.png" style="width:3.43169in;height:1.42945in" />

The **AppOwnsDataClient** application is designed to be a consumer of
the Web API exposed by **AppOwnsDataWebApi**. The security requirements
for this type of service-oriented architecture require a second Azure AD
application which makes it possible for users of the
**AppOwnsDataClient** application to login and to make secure APIs calls
to **AppOwnsDataWebApi**.

<img src="Images\ReadMe\media\image10.png" style="width:4.45714in;height:1.31905in" />

When the **AppOwnsDataClient** application executes an API call on
**AppOwnsDataWebApi**, it must pass an access token acquired from Azure
AD. Once **AppOwnsDataWebApi** is able validate the access token is
authentic, it's able to determine the user's login ID. Once
**AppOwnsDataWebApi** determines the login ID for the current user, it
can then retrieve user profile data from **AppOwnsDataDB** to determine
what permissions have nee assigned to this user.

The Azure AD application for the **AppOwnsDataClient** application is
configured to support organizational accounts from any Microsoft 365
tenant as well as Microsoft personal accounts for Skype and Xbox. You
could take this further by using the support in Azure AD for
authenticating users with other popular identity provides such as
Google, Twitter and Facebook. After all, a key advantage of
App-Owns-Data embedding is that you can use any identity provider you'd
like.

Ow let's examine what goes on behind the scenes when a user is using the
**AppOwnsDataClient** application. When the user first authenticates
with Azure AD, the **AppOwnsDataClient** application calls to the
**UserLogin** endpoint of **AppOwnsDataWebApi** and passes the user's
**LoginId** and **UserName**. This allows **AppOwnsDataWebApi** to
update the **LastLogin** value for existing users and to add a new
record for any authenticated user who did not previous have an
associated record in the **Users** table of **AppOwnsDataDB**.

<img src="Images\ReadMe\media\image11.png" style="width:3.99386in;height:0.73878in" />

After the user has logged in, the **AppOwnsDataClient** application
calls the **Embed** endpoint to retrieve a view model which contains all
the data required for embedding reports from the tenant workspace in
Power BI. This view model includes the embed token which has been
generated to give the user the correct level of permissions determined
by inspecting the user profile in **AppOwnsDataDB**.

<img src="Images\ReadMe\media\image12.png" style="width:4.04908in;height:1.00544in" />

The **AppOwnsDataClient** application allows any user to login. All that
is required is that the user has an Azure AD account which can be either
an organizational account or a personal account. When a user logs in for
the first time, there is code in **AppOwnsDataWebApi** that
automatically adds a new record for the user. However, when users are
created on the fly like this, they are not assigned to any tenant. In
this case, returns a view model with no embedding data and a blank
tenant name. The **AppOwnsDataClient** application responds to this view
model with the following screen notifying the user that they need to be
assigned to a tenant before they can begin to view reports.

<img src="Images\ReadMe\media\image13.png" style="width:4.45714in;height:1.4354in" />

A valuable aspect of the App-Owns-Data Starter Kit architecture is it
adds its own custom telemetry layer. The **AppOwnsDataClient**
application has been designed to call the **ActivityLog** endpoint of
**AppOwnsDataWebApi** whenever there is user activity that needs to be
monitored. **AppOwnsDataWebApi** responds to calls to the
**ActivityLog** endpoint by creating a new record in the **ActivityLog**
table in **AppOwnsDataDB** to record the user activity. This makes it
possible to monitor user activity such as viewing reports, editing
reports, creating reports and copying reports.

<img src="Images\ReadMe\media\image14.png" style="width:4.3in;height:1.54187in" />

Given the architecture of this custom telemetry layer, it's now possible
to see all user activity for report viewing and report authoring by
examining the records in the **ActivityLog** table.

<img src="Images\ReadMe\media\image15.png" style="width:4.25767in;height:1.07399in" />

In addition to capturing usage data focused on user activity, this
telemetry layer also captures performance data which makes it possible
to monitor how fast reports are loaded and rendered in the browser. The
is accomplished by adding client-side code using the Power BI JavaScript
API which records the load duration and the render duration anytime it
embed a report. This makes it possible to monitor report performance
across a multi-tenant environment and see which reports require
attention due to slow load and render times.

<img src="Images\ReadMe\media\image16.png" style="width:3.79755in;height:1.41895in" />

Many developer who are beginning to develop with App-Owns-Data embedding
spend time trying to figure out how to monitor user activity by using
the Activity logs generated by the Power BI Service. However, this is
not as straightforward as one might expect. With App-Owns-Data
embedding, a report is embedded using an embed token generated by a
service principal. In this scenario, the Power BI Activity log does not
record the name of the actual user. Instead, the Power BI logging
service adds the Application ID of the service principal as the current
user. Unfortunately, that doesn't provide useful information with
respect to user activity.

In order to map user names in an App-Owns-Data embedding scenario to the
Power BI activity log event, there is extra work required. When you
embed a report with client-side code in the browser, it's possible to
capture the event correlation ID which maps back to request IDs in the
Power BI activity log. The idea is that you can map the correlation ID
and the current user name back to the request ID for an event in the
Power BI activity log. However, that takes more work and this extra
effort doesn't really provide any additional usage data beyond what
being recorded with the custom telemetry layer that is demonstrated in
the **App-Owns-Data Starter Kit** solution.

Let's conclude this section with a final question. Is it important to
integrate the Power BI activity logs into a solution that uses
App-Owns-Data embedding? The answer is no. It becomes unnecessary once
you have created your own custom telemetry layer. Furthermore, it
usually take about 15 minutes for activity to show up in the Power BI
activity log. Compare this to a custom telemetry layer where usage data
is available immediately after an event has been logged by the
**AppOwnsDataClient** application.

### Understanding the AppOwnsDataShared class library project

The **AppOwnsDataDB** database is built using the .NET 5 version of the
Entity Framework known as [Entity Framework
Core](https://docs.microsoft.com/en-us/ef/core/). Entity Framework
supports the ***Code First*** approach where the developer starts by
modeling database tables using classes defined in C\#. The Code First
approach has advantages while you're still in the development phase
because its very easy to change the database schema in your C\# code and
then apply those changes to the database you're in the development
lifecycle.

The C\# code which creates and accesses the **AppOwnsDataDB** database
is included in a class library project named **AppOwnsDataShared**. By
adding the Entity Framework code to a class library project, it can be
shared across the two application projects for **AppOwnsDataAdmin** and
**AppOwnsDataWebApi**.

One import thing to keep in mind is that the **AppOwnsDataShared**
project is a class library which cannot have its own configuration file.
Therefore, the connection string for the **AppOwnsDataDB** database is
tracked in configuration files for both the **AppOwnsDataAdmin**
application and for **AppOwnsDataWebApi**.

The **Tenants** table in **AppOwnsDataDB** is generated by a C\# class
named **PowerBITenant**.

<img src="Images\ReadMe\media\image17.png" style="width:1.88957in;height:0.93414in" />

The **Users** table is generated using the table schema defined by
the **User** class.

<img src="Images\ReadMe\media\image18.png" style="width:1.6135in;height:0.94617in" />

The **ActivityLog** table is generated using the table schema defined by
the **ActivityLogEntry**.

<img src="Images\ReadMe\media\image19.png" style="width:1.57055in;height:1.3391in" />

The database model itself is created by the **AppOwnsDataDB** class
which derives from **DBContext**.

<img src="Images\ReadMe\media\image20.png" style="width:3.25455in;height:1.29448in" />

The **AppOwsDataShared** project contains a public class named
**AppOwnsDataDbService** which contains all the shared logic to execute
read and write operations on the **AppOwnsDataDB** database. The
**AppOwnsDataAdmin** application and **AppOwnsDataWebApi** both access
**AppOwnsDataDB** by calling public methods in the
**AppOwnsDataDbService** class.

<img src="Images\ReadMe\media\image21.png" style="width:4.70552in;height:1.5364in" />

## Set up your development environment

You can follow the steps in this document to set up the **App-Owns-Data
Starter Kit** solution for testing. To complete these steps, you will
require a Microsoft 365 tenant in which you have permissions to create
and manage Azure AD applications and security groups. You will also need
Power BI Service administrator permissions to configure Power BI
settings to give the service principal for an Azure AD application to
ability to access the Power BI Service API. If you do not have a
Microsoft 365 environment for testing, you can create one for free by
following the steps in [Create a Development Environment for Power BI
Embedding](https://github.com/PowerBiDevCamp/Camp-Sessions/raw/master/Create%20Power%20BI%20Development%20Environment.pdf).

To set up the  **App-Owns-Data Starter Kit** solution for testing, you
will need to configure a Microsoft 365 tenant by completing the
following tasks.

-   Create an Azure AD security group named **Power BI Apps**

-   Configure Power BI tenant-level settings for service principal
    access

-   Create the Azure AD Application named **App-Owns-Data Service App**

-   Create the Azure AD Application named **App-Owns-Data Client App**

The following three sections will step through each of these setup
tasks.

### Create an Azure AD security group named Power BI Apps

Begin by navigating to the [Groups management
page](https://portal.azure.com/#blade/Microsoft_AAD_IAM/GroupsManagementMenuBlade/AllGroups) in
the Azure portal. Once you get to the **Groups** page in the Azure
portal, click the **New group** link.

<img src="Images\ReadMe\media\image22.png" style="width:3.91228in;height:1.302in" alt="Graphical user interface, text, application Description automatically generated" />

In the **New Group** dialog, Select a **Group type** of **Security** and
enter a **Group name** of **Power BI Apps**. Click the **Create** button
to create the new Azure AD security group.

<img src="Images\ReadMe\media\image23.png" style="width:3.91181in;height:1.80963in" alt="Graphical user interface, text, application, email Description automatically generated" />

Verify that you can see the new security group named **Power BI
Apps** on the Azure portal **Groups** page.

<img src="Images\ReadMe\media\image24.png" style="width:4.08772in;height:1.18963in" alt="Graphical user interface, text, application Description automatically generated" />

### Configure Power BI tenant-level settings for service principal access

Next, you need you enable a tenant-level setting for Power BI
named **Allow service principals to use Power BI APIs**. Navigate to the
Power BI Service admin portal at <https://app.powerbi.com/admin-portal>.
In the Power BI Admin portal, click the **Tenant settings** link on the
left.

<img src="Images\ReadMe\media\image25.png" style="width:1.95714in;height:1.27828in" alt="Graphical user interface, application Description automatically generated" />

Move down in the **Developer settings** section and expand the **Allow
service principals to use Power BI APIs** section.

<img src="Images\ReadMe\media\image26.png" style="width:2.14286in;height:1.32066in" alt="Graphical user interface, application Description automatically generated" />

Note that the **Allow service principals to use Power BI APIs** setting
is initially set to **Disabled**.

<img src="Images\ReadMe\media\image27.png" style="width:2.97143in;height:1.44643in" alt="Graphical user interface, text, application, email Description automatically generated" />

Change the setting to **Enabled**. After that, set the **Apply
to** setting to **Specific security groups** and add the **Power BI
Apps** security group as shown in the screenshot below. Click
the **Apply** button to save your configuration changes.

<img src="Images\ReadMe\media\image28.png" style="width:2.72857in;height:1.79682in" alt="Graphical user interface, text, application Description automatically generated" />

You will see a notification indicating it might take up to 15 minutes to
apply these changes to the organization.

<img src="Images\ReadMe\media\image29.png" style="width:4.02857in;height:0.72601in" alt="Text Description automatically generated with medium confidence" />

Now scroll upward in the **Tenant setting** section of the Power BI
admin portal and locate **Workspace settings**.

<img src="Images\ReadMe\media\image30.png" style="width:4.0241in;height:2.01429in" alt="Graphical user interface, application, Teams Description automatically generated" />

Note that a new Power BI tenant has an older policy where only users who
have the permissions to create Office 365 groups can create new Power BI
workspaces. You must reconfigure this setting so that service principals
in the **Power BI Apps** group will be able to create new workspaces.

<img src="Images\ReadMe\media\image31.png" style="width:4.22802in;height:2.12857in" alt="Graphical user interface, text, application, email Description automatically generated" />

In **Workspace settings**, set **Apply to** to **Specific security**
groups, add the **Power BI Apps** security group and click
the **Apply** button to save your changes.

<img src="Images\ReadMe\media\image32.png" style="width:3.8in;height:3.34435in" />

You have now completed the configuration of Power BI tenant-level
settings.

### Create the **App-Owns-Data Service App in Azure AD**

Login to the Azure portal to create the new Azure AD application. Begin
by navigating to the [App
registration](https://portal.azure.com/#blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/RegisteredApps) page
in the Azure portal and click the **New registration** link.

<img src="Images\ReadMe\media\image33.png" style="width:4.61429in;height:1.28125in" alt="Graphical user interface, text, application, email Description automatically generated" />

On the **Register an application** page, enter an application name of
**App-Owns-Data Service App** and accept the default selection
for **Supported account types** of **Accounts in this organizational
directory only**.

<img src="Images\ReadMe\media\image34.png" style="width:3.75714in;height:1.83152in" />

Complete the following steps in the **Redirect URI** section.

1.  Leave the default selection of **Web** in the dropdown box

2.  Enter a **Redirect
    URI** of [**https://localhost:44300/signin-oidc**](https://localhost:44300/signin-oidc)

3.  Click the **Register** button to create the new Azure AD
    application.

<img src="Images\ReadMe\media\image35.png" style="width:4.72857in;height:1.32309in" alt="Graphical user interface, text, application Description automatically generated" />

After creating a new Azure AD application in the Azure portal, you
should see the Azure AD application overview page which displays
the **Application ID**. Note that the ***Application ID*** is often
called the ***Client ID***, so don't let this confuse you. You will need
to copy this Application ID and store it so you can use it later to
configure the project's support for Client Credentials Flow.

<img src="Images\ReadMe\media\image36.png" style="width:4.19082in;height:1.58571in" />

Copy the **Client ID** (aka Application ID) and paste it into a text
document so you can use it later in the setup process. Note that
this **Client ID** value will be used by **AppOwnsDataAdmin** project
and the **AppOwnsDataWebApi** project to configure authentication with
Azure AD.

<img src="Images\ReadMe\media\image37.png" style="width:4.53769in;height:1.4in" />

Next, repeat the same step by copying the **Tenant ID** and copying that
into the text document as well.

<img src="Images\ReadMe\media\image38.png" style="width:4.64286in;height:1.16071in" />

Your text document should now contain the **Client ID** and **Tenant
ID** as shown in the following screenshot.

<img src="Images\ReadMe\media\image39.png" style="width:4.12857in;height:1.94248in" />

Next, you need to create a Client Secret for the application. Click on
the **Certificates & secrets** link in the left navigation to move to
the **Certificates & secrets** page. On the **Certificates &
secrets** page, click the **New client secret** button as shown in the
following screenshot.

<img src="Images\ReadMe\media\image40.png" style="width:5.75714in;height:2.71271in" />

In the **Add a client secret** dialog, add a text description such
as **Test Secret** and then click the **Add** button to create the new
Client Secret.

<img src="Images\ReadMe\media\image41.png" style="width:3.35714in;height:1.68475in" />

Once you have created the Client Secret, you should be able to see
its **Value** in the **Client secrets** section. Click on the **Copy to
clipboard** button to copy the Client Secret into the clipboard.

<img src="Images\ReadMe\media\image42.png" style="width:4.55714in;height:1.26103in" alt="Graphical user interface, text, application, email Description automatically generated" />

Paste the **Client Secret** into the same text document with
the **Client ID** and **Tenant ID**.

<img src="Images\ReadMe\media\image43.png" style="width:4.25714in;height:2.38934in" />

Last thing is to add the service principal for this app to Azure AD
Security group named Power BI Apps.

<img src="Images\ReadMe\media\image44.png" style="width:5.65833in;height:2.35276in" />

dddddd

<img src="Images\ReadMe\media\image45.png" style="width:5.17143in;height:1.5476in" />

### Create the Azure AD Application for the **App-Owns-Data Client App**

Login to the Azure portal to create the new Azure AD application. Begin
by navigating to the [App
registration](https://portal.azure.com/#blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/RegisteredApps) page
in the Azure portal and click the **New registration** link.

<img src="Images\ReadMe\media\image46.png" style="width:5.58571in;height:1.55099in" alt="Graphical user interface, text, application, email Description automatically generated" />

On the **Register an application** page, enter an application name of
**App-Owns-Data Client App** and change **Supported account
types** to **Accounts in any organizational directory and personal
Microsoft accounts**.

<img src="Images\ReadMe\media\image47.png" style="width:4.99405in;height:1.96761in" />

Complete the following steps in the **Redirect URI** section.

1.  Leave the default selection of **Web** in the dropdown box

2.  Enter a **Redirect
    URI** of [**https://localhost:44301/**](https://localhost:44301/).

3.  Click the **Register** button to create the new Azure AD
    application.

<img src="Images\ReadMe\media\image48.png" style="width:3.6in;height:1.10369in" />

After creating a new Azure AD application in the Azure portal, you
should see the Azure AD application overview page which displays
the **Application ID**. Copy the **Client ID** (aka Application ID) and
paste it into a text document so you can use it later in the setup
process. Note that this **Client ID** value will be used
by **AppOwnsDataClient** project and the **AppOwnsDataWebApi** project
to configure authentication with Azure AD.

<img src="Images\ReadMe\media\image49.png" style="width:2.35714in;height:1.85457in" />

Expose an

<img src="Images\ReadMe\media\image50.png" style="width:3.85714in;height:2.11374in" />

ddddd

<img src="Images\ReadMe\media\image51.png" style="width:5.48671in;height:1.94286in" />

sssssss

<img src="Images\ReadMe\media\image52.png" style="width:3.56251in;height:1.68571in" />

aa

<img src="Images\ReadMe\media\image53.png" style="width:3in;height:1.84459in" />

<img src="Images\ReadMe\media\image54.png" style="width:2.41913in;height:2.2in" />

<img src="Images\ReadMe\media\image55.png" style="width:4.3in;height:1.30483in" />

N n n n

api://046a89da-c98e-40f0-a11b-a3d71289556f/Reports.Embed

kkmkmkm

## Open the App-Owns-Data Starter Kit solution in Visual Studio 2019

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

xxxxx

<img src="Images\ReadMe\media\image56.png" style="width:6.42773in;height:2.10647in" />

You can download the **AppOwnsDataAdmin** project source files in a
single ZIP archive using [this
link](https://github.com/PowerBiDevCamp/App-Owns-Data-Starter-Kit/archive/refs/heads/main.zip).

<img src="Images\ReadMe\media\image57.png" style="width:6.37143in;height:2.31945in" />

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

<img src="Images\ReadMe\media\image58.png" style="width:6.51071in;height:2.6772in" />

### Open AppOwnsDataStarterKit.sln in Visual Studio 2019

Launch Visual Studio 2019 and use the **File &gt; Open &gt;
Project/Solution** menu command to open the solution file
named **AppOwnsDataStarterKit.sln**. You should see the four child
projects named **AppOwnsDataAdmin**, **AppOwnsClient**,
**AppOwnsDataShared** and **AppOwnsDataWebApi**.

<img src="Images\ReadMe\media\image59.png" style="width:4.40833in;height:2.19167in" />

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

<img src="Images\ReadMe\media\image60.png" style="width:6.13686in;height:2.14286in" />

Inside the **AzureAd** section, update
the **TenantId**, **ClientId** and **ClientSecret** with the data you
collected when creating the Azure AD application named **Power BI Tenant
Management Application.**

<img src="Images\ReadMe\media\image61.png" style="width:3.59649in;height:1.36527in" alt="Text Description automatically generated" />

If you are using Visual Studio 2019, you should be able leave the
database connection string the way it is with the **Server** setting
of **(localdb)\\\\MSSQLLocalDB**. You can change this connection string
to point to a different server if you'd rather create the project
database named **AppOwnsDataDB** in a different location.

<img src="Images\ReadMe\media\image62.png" style="width:6.5in;height:0.8375in" alt="Text Description automatically generated with low confidence" />

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

<img src="Images\ReadMe\media\image63.png" style="width:4.68681in;height:1.52153in" alt="Graphical user interface, text, application, email Description automatically generated" />

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

<img src="Images\ReadMe\media\image64.png" style="width:10.4in;height:3.95833in" />

When you inspect the code inside **AppOwnsDataDB.cs**, you will see a
class named **AppOwnsDataDB** that derives from **DbContext** to add
support for automatic database generation using Entity Framework.
The **AppOwnsDataDB** class serves as the top-level class for the Entity
Framework which contains three  **DBSet** properties
named **AppIdentites** and **Tenants**.

After you have inspected the code used to generated the database, close
the source file named **AppOwnsDataDB.cs** without saving any changes.
The next step is to run the PowerShell commands to create the project
database named **AppOwnsDataDB**.

Open the Package Manager console using **Tools &gt; NuGet Package
Manager &gt; Package Manager Console**.

<img src="Images\ReadMe\media\image65.png" style="width:6.2912in;height:1.925in" alt="Graphical user interface, application Description automatically generated" />

You should see the **Package Manager Console** command prompt where you
can execute PowerShell commands.

<img src="Images\ReadMe\media\image66.png" style="width:9.8in;height:4.30833in" />

<img src="Images\ReadMe\media\image67.png" style="width:4.7in;height:5.38333in" />

<img src="Images\ReadMe\media\image68.png" style="width:9.825in;height:3.31667in" />

Type and execute the following **Add-Migration** command to create a new
Entity Framework migration in the project.

Add-Migration InitialCreate

The **Add-Migration** command should run without errors. If this command
fails you might have to modify the database connection string
in **appsettings.json**.

<img src="Images\ReadMe\media\image69.png" style="width:8.15in;height:1.65833in" />

After running the Add-Migration command, you will see a new folder has
been added to the project named **Migrations** with several C\# source
files. There is no need to change anything in thee source files but you
can inspect what's inside them if you are curious how the Entity
Framework does its work.

<img src="Images\ReadMe\media\image70.png" style="width:11.96667in;height:5.7in" />

Return to the **Package Manager Console** and run the
following **Update-Database** command to generate the database
named **AppOwnsDataDB**.

Update-Database

The **Update-Database** command should run without errors and generate
the database named **AppOwnsDataDB**.

<img src="Images\ReadMe\media\image71.png" style="width:8.35833in;height:2.8in" />

In Visual Studio, you can use the **SQL Server Object Explorer** to see
the database that has just been created. Open the **SQL Server Object
Explorer** by invoking the **View &gt;** **SQL Server Object
Explorer** menu command.

<img src="Images\ReadMe\media\image72.png" style="width:3.2807in;height:1.73134in" alt="Graphical user interface, text, application Description automatically generated" />

Expand the **Databases** node for the server you are using and verify
you an see the new database named **AppOwnsDataDB**.

<img src="Images\ReadMe\media\image73.png" style="width:3.50833in;height:2.45in" />

If you expand the **Tables** node for **AppOwnsDataDB**, you should see
the two tables named **AppIdentities** and **Tenants**.

<img src="Images\ReadMe\media\image74.png" style="width:3.89363in;height:2.06667in" />

The **AppOwnsDataDB** database has now been set up and you are ready to
run the application in the Visual Studio debugger.

## Test the AppOwnsDataAdmin Application

Launch the **AppOwnsDataAdmin** web application in the Visual Studio
debugger by pressing the **{F5}** key or clicking the Visual
Studio **Play** button with the green arrow and the caption **IIS
Express**.

<img src="Images\ReadMe\media\image75.png" style="width:7.69048in;height:2.48382in" />

When the application starts, click the **Sign in** link in the upper
right corner to begin the user login sequence.

<img src="Images\ReadMe\media\image76.png" style="width:7.40119in;height:2.52073in" />

The first time you authenticate with Azure AD, you'll be prompted with
the **Permissions requested** dialog asking you to accept the delegated
permissions for the Microsoft Graph API requested by the application.
Click the **Accept** button to grant these permissions and continue.

<img src="Images\ReadMe\media\image77.png" style="width:2.02857in;height:2.4903in" />

Once you have logged in, you should see your name in the welcome
message.

<img src="Images\ReadMe\media\image78.png" style="width:7.02857in;height:1.96529in" />

### Create New Customer Tenants

Start by creating a few new customer tenants. Click the **Tenants** link
to navigate to the **Tenants** page.

<img src="Images\ReadMe\media\image79.png" style="width:7.05357in;height:2.00215in" />

Click the **Onboard New Tenant** button to display the **Onboard New
Tenant** page.

<img src="Images\ReadMe\media\image80.png" style="width:7.73809in;height:1.42943in" />

When you open the **Onboard New Tenant** page, it will automatically
populate the **Tenant Name** textbox with a value of **Tenant01**. You
can create the first tenant using the default values supplied by
the **Onboard New Tenant** page or supply a different name. Click
to **Create New Tenant** button to begin the process of creating a new
customer tenant.

<img src="Images\ReadMe\media\image81.png" style="width:7.06548in;height:2.76378in" />

After a few seconds, you should see the new customer tenant has been
created.

Click the **Onboard New Tenant** button again to create a second tenant.

This time, select a different database for **Database Name** and then
click **Create New Tenant**.

You should now have two customer tenants. Note they each tenant has .

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

<img src="Images\ReadMe\media\image82.png" style="width:1.66667in;height:1.79669in" alt="A picture containing graphical user interface Description automatically generated" />

Navigate to one of these workspaces such as **Tenant01**.

<img src="Images\ReadMe\media\image83.png" style="width:4in;height:1.51111in" alt="Graphical user interface, text, email Description automatically generated" />

Drill into the **Setting** page for the dataset named **Sales**.

<img src="Images\ReadMe\media\image84.png" style="width:3.52632in;height:1.81682in" alt="Graphical user interface, application Description automatically generated" />

You should be able to verify that the **Sales** dataset has been
configured by one of the Azure AD applications that was created by
the **AppOwnsDataAdmin** application. You should also be able to see
the **Last refresh succeeded** message for the dataset refresh operation
that was started by the **AppOwnsDataAdmin** as part of its tenant
onboarding logic.

<img src="Images\ReadMe\media\image85.png" style="width:4.85965in;height:1.41376in" alt="Graphical user interface, application Description automatically generated" />

## Test the AppOwnsDataClient Application

xxxx

### Configure the WebAPI appsettings.

This concludes the walkthrough of the **AppOwnsDataAdmin** application.

### Configure the AppOwnsDataClient application

### Run the AppOwnsDataClient application

### Assign User Permissions

### Create and Edit Reports using AppOwnsDataClient

## Use the Activity Log to monitor usage and report performance 

### Inspect the Usage Data in AppOwnsDataDB

### Inspect Usage Data using AppOwsDataUsageReporting.pbix
