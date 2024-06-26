/* eslint-disable react/prop-types */

const UserListItem = ({ user, handleFunction }) => {
    return (
        <button
            onClick={handleFunction}
            className="cursor-pointer bg-gray-200 hover:bg-teal-400 text-black hover:text-white w-full flex items-center px-3 py-2 mb-2 rounded-lg"
        >
            <image size="sm" cursor="pointer" name={user.name} src={user.pic} />
            <div>
                <text>{user.name}</text>
                <text>
                    <b>Email : </b>
                    {user.email}
                </text>
            </div>
        </button>
    );
};

export default UserListItem;
